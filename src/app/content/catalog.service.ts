import { Injectable, InjectionToken, inject } from '@angular/core';
import type { LessonRef, Track } from '../domain/catalog.model';
import { PLANNED_TRACKS, TRACKS } from './tracks';

/** Injected rather than imported so tests (and future remote catalogs) can swap the source. */
export const TRACK_REGISTRY = new InjectionToken<readonly Track[]>('TRACK_REGISTRY', {
  providedIn: 'root',
  factory: () => TRACKS,
});

export type LessonNeighbours = {
  readonly previous: LessonRef | undefined;
  readonly next: LessonRef | undefined;
};

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly tracks = inject(TRACK_REGISTRY);
  readonly plannedTracks = PLANNED_TRACKS;

  /** Every lesson of every track in reading order. Built once: the catalog is static. */
  readonly lessons: readonly LessonRef[] = this.tracks.flatMap((track) =>
    track.sections.flatMap((section) => section.lessons.map((lesson) => ({ track, section, lesson }))),
  );

  findTrack(trackId: string): Track | undefined {
    return this.tracks.find((track) => track.id === trackId);
  }

  findLesson(trackId: string, lessonId: string): LessonRef | undefined {
    return this.lessons.find((ref) => ref.track.id === trackId && ref.lesson.id === lessonId);
  }

  lessonsOf(trackId: string): readonly LessonRef[] {
    return this.lessons.filter((ref) => ref.track.id === trackId);
  }

  neighbours(trackId: string, lessonId: string): LessonNeighbours {
    const trackLessons = this.lessonsOf(trackId);
    const index = trackLessons.findIndex((ref) => ref.lesson.id === lessonId);
    if (index === -1) {
      return { previous: undefined, next: undefined };
    }
    return { previous: trackLessons[index - 1], next: trackLessons[index + 1] };
  }
}
