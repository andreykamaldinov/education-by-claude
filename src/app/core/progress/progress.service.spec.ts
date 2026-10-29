import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from '../storage/local-storage.service';
import { ProgressService } from './progress.service';

class MemoryStorage {
  readonly data = new Map<string, unknown>();
  read(key: string): unknown {
    return this.data.get(key);
  }
  write(key: string, value: unknown): void {
    this.data.set(key, value);
  }
}

describe('ProgressService', () => {
  let storage: MemoryStorage;

  const create = (): ProgressService => {
    TestBed.configureTestingModule({ providers: [{ provide: LocalStorageService, useValue: storage }] });
    return TestBed.inject(ProgressService);
  };

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('toggles lessons and counts them per track', () => {
    const progress = create();

    progress.toggleLesson('angular', 'signals');
    progress.toggleLesson('angular', 'routing');
    progress.toggleLesson('rxjs', 'subjects');
    progress.toggleLesson('angular', 'routing');

    expect(progress.isLessonCompleted('angular', 'signals')).toBe(true);
    expect(progress.isLessonCompleted('angular', 'routing')).toBe(false);
    expect(progress.completedInTrack('angular')).toBe(1);
    expect(progress.completedLessonsCount()).toBe(2);
  });

  it('persists state through effects', () => {
    const progress = create();

    progress.markExerciseSolved('js-debounce');
    progress.recordQuizScore('angular', 70);
    TestBed.tick();

    expect(storage.data.get('progress.exercises.v1')).toEqual(['js-debounce']);
    expect(storage.data.get('progress.quizzes.v1')).toEqual({ angular: 70 });
  });

  it('keeps only the best quiz score', () => {
    const progress = create();

    progress.recordQuizScore('rxjs', 80);
    progress.recordQuizScore('rxjs', 40);

    expect(progress.quizScores()['rxjs']).toBe(80);
  });

  it('ignores malformed stored data instead of crashing', () => {
    storage.write('progress.lessons.v1', { not: 'an array' });
    storage.write('progress.quizzes.v1', ['wrong']);

    const progress = create();

    expect(progress.completedLessonsCount()).toBe(0);
    expect(progress.quizScores()).toEqual({});
  });
});
