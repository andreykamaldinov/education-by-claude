import { Injectable, InjectionToken, inject } from '@angular/core';
import type { Quiz } from '../../domain/quiz.model';
import { QUIZZES } from './index';

export const QUIZ_REGISTRY = new InjectionToken<readonly Quiz[]>('QUIZ_REGISTRY', {
  providedIn: 'root',
  factory: () => QUIZZES,
});

@Injectable({ providedIn: 'root' })
export class QuizCatalogService {
  readonly quizzes = inject(QUIZ_REGISTRY);

  find(trackId: string): Quiz | undefined {
    return this.quizzes.find((quiz) => quiz.trackId === trackId);
  }
}
