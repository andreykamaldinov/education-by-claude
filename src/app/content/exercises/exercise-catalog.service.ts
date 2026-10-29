import { Injectable, InjectionToken, inject } from '@angular/core';
import type { Exercise } from '../../domain/exercise.model';
import { EXERCISES } from './index';

export const EXERCISE_REGISTRY = new InjectionToken<readonly Exercise[]>('EXERCISE_REGISTRY', {
  providedIn: 'root',
  factory: () => EXERCISES,
});

@Injectable({ providedIn: 'root' })
export class ExerciseCatalogService {
  readonly exercises = inject(EXERCISE_REGISTRY);

  find(exerciseId: string): Exercise | undefined {
    return this.exercises.find((exercise) => exercise.id === exerciseId);
  }

  byTrack(trackId: string): readonly Exercise[] {
    return this.exercises.filter((exercise) => exercise.trackId === trackId);
  }

  forLesson(trackId: string, lessonId: string): readonly Exercise[] {
    return this.exercises.filter(
      (exercise) => exercise.trackId === trackId && exercise.relatedLessonId === lessonId,
    );
  }

  next(exerciseId: string): Exercise | undefined {
    const index = this.exercises.findIndex((exercise) => exercise.id === exerciseId);
    return index === -1 ? undefined : this.exercises[index + 1];
  }
}
