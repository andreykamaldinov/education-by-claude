import { Injectable, computed, inject, signal } from '@angular/core';
import { CatalogService } from '../../content/catalog.service';
import { ExerciseCatalogService } from '../../content/exercises/exercise-catalog.service';

export type SearchHitKind = 'track' | 'lesson' | 'exercise';

export type SearchHit = {
  readonly kind: SearchHitKind;
  readonly title: string;
  readonly context: string;
  readonly url: string;
  readonly accent: string;
};

type IndexedHit = SearchHit & { readonly haystack: string; readonly titleKey: string };

const MAX_HITS = 12;

const normalize = (text: string): string => text.toLowerCase().replace(/ё/g, 'е');

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly catalog = inject(CatalogService);
  private readonly exercises = inject(ExerciseCatalogService);

  private readonly index: readonly IndexedHit[] = this.buildIndex();

  readonly isOpen = signal(false);
  readonly query = signal('');

  readonly hits = computed<readonly SearchHit[]>(() => {
    const words = normalize(this.query()).split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return this.index.filter((hit) => hit.kind === 'track');
    }
    return this.index
      .filter((hit) => words.every((word) => hit.haystack.includes(word)))
      .map((hit) => ({ hit, score: rank(hit, words) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HITS)
      .map(({ hit }) => hit);
  });

  open(): void {
    this.query.set('');
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  private buildIndex(): IndexedHit[] {
    const tracks = this.catalog.tracks.map<IndexedHit>((track) => ({
      kind: 'track',
      title: track.title,
      context: 'Трек',
      url: `/tracks/${track.id}`,
      accent: track.accent,
      titleKey: normalize(track.title),
      haystack: normalize(`${track.title} ${track.short} ${track.description}`),
    }));
    const lessons = this.catalog.lessons.map<IndexedHit>(({ track, section, lesson }) => ({
      kind: 'lesson',
      title: lesson.title,
      context: `${track.title} / ${section.title}`,
      url: `/tracks/${track.id}/${lesson.id}`,
      accent: track.accent,
      titleKey: normalize(lesson.title),
      haystack: normalize(
        `${lesson.title} ${lesson.summary} ${lesson.tags.join(' ')} ${track.title} ${track.short}`,
      ),
    }));
    const exercises = this.exercises.exercises.map<IndexedHit>((exercise) => {
      const track = this.catalog.findTrack(exercise.trackId);
      return {
        kind: 'exercise',
        title: exercise.title,
        context: `Практика / ${track?.title ?? exercise.trackId}`,
        url: `/practice/${exercise.id}`,
        accent: track?.accent ?? 'currentColor',
        titleKey: normalize(exercise.title),
        haystack: normalize(`${exercise.title} практика задача ${track?.title ?? ''}`),
      };
    });
    return [...tracks, ...lessons, ...exercises];
  }
}

const rank = (hit: IndexedHit, words: readonly string[]): number => {
  const titleHits = words.filter((word) => hit.titleKey.includes(word)).length;
  const startsWith = words.some((word) => hit.titleKey.startsWith(word)) ? 2 : 0;
  const kindBonus = hit.kind === 'lesson' ? 1 : hit.kind === 'track' ? 1.5 : 0;
  return titleHits * 3 + startsWith + kindBonus;
};
