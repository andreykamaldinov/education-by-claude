import { inject } from '@angular/core';
import type { CanMatchFn, ResolveFn, Routes } from '@angular/router';
import { CatalogService } from './content/catalog.service';
import { ExerciseCatalogService } from './content/exercises/exercise-catalog.service';

/** Unknown track or lesson ids fall through to the not-found page instead of rendering an empty shell. */
const trackExists: CanMatchFn = (_route, segments) => {
  const trackId = segments[1]?.path ?? '';
  return inject(CatalogService).findTrack(trackId) !== undefined;
};

const lessonExists: CanMatchFn = (_route, segments) => {
  const trackId = segments[1]?.path ?? '';
  const lessonId = segments[2]?.path ?? '';
  return inject(CatalogService).findLesson(trackId, lessonId) !== undefined;
};

const exerciseExists: CanMatchFn = (_route, segments) => {
  const exerciseId = segments[1]?.path ?? '';
  return inject(ExerciseCatalogService).find(exerciseId) !== undefined;
};

const trackTitle: ResolveFn<string> = (route) =>
  inject(CatalogService).findTrack(route.paramMap.get('trackId') ?? '')?.title ?? 'Трек';

const lessonTitle: ResolveFn<string> = (route) =>
  inject(CatalogService).findLesson(
    route.paramMap.get('trackId') ?? '',
    route.paramMap.get('lessonId') ?? '',
  )?.lesson.title ?? 'Урок';

const exerciseTitle: ResolveFn<string> = (route) =>
  inject(ExerciseCatalogService).find(route.paramMap.get('exerciseId') ?? '')?.title ?? 'Задача';

const quizTitle: ResolveFn<string> = (route) => {
  const track = inject(CatalogService).findTrack(route.paramMap.get('trackId') ?? '');
  return track ? `Вопросы: ${track.title}` : 'Вопросы';
};

export const routes: Routes = [
  {
    path: '',
    title: 'Учебная платформа фронтенд-разработчика',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'tracks',
    title: 'Все треки',
    loadComponent: () => import('./features/track/catalog-page').then((m) => m.CatalogPage),
  },
  {
    path: 'tracks/:trackId',
    canMatch: [trackExists],
    title: trackTitle,
    loadComponent: () => import('./features/track/track-page').then((m) => m.TrackPage),
  },
  {
    path: 'tracks/:trackId/:lessonId',
    canMatch: [lessonExists],
    title: lessonTitle,
    loadComponent: () => import('./features/lesson/lesson-page').then((m) => m.LessonPage),
  },
  {
    path: 'practice',
    title: 'Практика',
    loadComponent: () => import('./features/practice/practice-page').then((m) => m.PracticePage),
  },
  {
    path: 'practice/:exerciseId',
    canMatch: [exerciseExists],
    title: exerciseTitle,
    loadComponent: () => import('./features/practice/exercise-page').then((m) => m.ExercisePage),
  },
  {
    path: 'quiz',
    title: 'Вопросы для собеседования',
    loadComponent: () => import('./features/quiz/quiz-list-page').then((m) => m.QuizListPage),
  },
  {
    path: 'quiz/:trackId',
    canMatch: [trackExists],
    title: quizTitle,
    loadComponent: () => import('./features/quiz/quiz-page').then((m) => m.QuizPage),
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    path: '**',
    title: 'Страница не найдена',
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
