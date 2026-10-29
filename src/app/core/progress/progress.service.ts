import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { lessonKey } from '../../domain/catalog.model';
import { isRecordOfNumbers, isStringArray } from '../../shared/utils/guards';
import { LocalStorageService } from '../storage/local-storage.service';

const STORAGE_KEYS = {
  lessons: 'progress.lessons.v1',
  exercises: 'progress.exercises.v1',
  quizzes: 'progress.quizzes.v1',
} as const;

/**
 * Learner progress as signals. State is read from storage once (validated at the boundary)
 * and written back by effects, so components only ever talk to signals.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly storage = inject(LocalStorageService);

  private readonly completedLessonKeys = signal<ReadonlySet<string>>(
    this.readSet(STORAGE_KEYS.lessons),
  );
  private readonly solvedExerciseIds = signal<ReadonlySet<string>>(
    this.readSet(STORAGE_KEYS.exercises),
  );
  private readonly quizBestScores = signal<Readonly<Record<string, number>>>(this.readScores());

  readonly completedLessonsCount = computed(() => this.completedLessonKeys().size);
  readonly solvedExercisesCount = computed(() => this.solvedExerciseIds().size);
  readonly quizScores = this.quizBestScores.asReadonly();

  constructor() {
    effect(() => this.storage.write(STORAGE_KEYS.lessons, [...this.completedLessonKeys()]));
    effect(() => this.storage.write(STORAGE_KEYS.exercises, [...this.solvedExerciseIds()]));
    effect(() => this.storage.write(STORAGE_KEYS.quizzes, this.quizBestScores()));
  }

  isLessonCompleted(trackId: string, lessonId: string): boolean {
    return this.completedLessonKeys().has(lessonKey(trackId, lessonId));
  }

  completedInTrack(trackId: string): number {
    const prefix = `${trackId}/`;
    return [...this.completedLessonKeys()].filter((key) => key.startsWith(prefix)).length;
  }

  toggleLesson(trackId: string, lessonId: string): void {
    const key = lessonKey(trackId, lessonId);
    this.completedLessonKeys.update((keys) => toggled(keys, key));
  }

  markLessonCompleted(trackId: string, lessonId: string): void {
    const key = lessonKey(trackId, lessonId);
    this.completedLessonKeys.update((keys) => (keys.has(key) ? keys : new Set([...keys, key])));
  }

  isExerciseSolved(exerciseId: string): boolean {
    return this.solvedExerciseIds().has(exerciseId);
  }

  markExerciseSolved(exerciseId: string): void {
    this.solvedExerciseIds.update((ids) =>
      ids.has(exerciseId) ? ids : new Set([...ids, exerciseId]),
    );
  }

  recordQuizScore(trackId: string, percent: number): void {
    this.quizBestScores.update((scores) => {
      const best = scores[trackId] ?? 0;
      return percent > best ? { ...scores, [trackId]: percent } : scores;
    });
  }

  private readSet(key: string): ReadonlySet<string> {
    const stored = this.storage.read(key);
    return new Set(isStringArray(stored) ? stored : []);
  }

  private readScores(): Readonly<Record<string, number>> {
    const stored = this.storage.read(STORAGE_KEYS.quizzes);
    return isRecordOfNumbers(stored) ? stored : {};
  }
}

const toggled = (set: ReadonlySet<string>, key: string): ReadonlySet<string> => {
  const next = new Set(set);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
};
