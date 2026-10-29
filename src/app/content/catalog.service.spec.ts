import { TestBed } from '@angular/core/testing';
import type { Track } from '../domain/catalog.model';
import { CatalogService, TRACK_REGISTRY } from './catalog.service';

const lesson = (id: string) => ({ id, title: id, summary: '', level: 'basic' as const, minutes: 5, tags: [] });

const FAKE_TRACKS: readonly Track[] = [
  {
    id: 'alpha',
    title: 'Alpha',
    short: 'A',
    description: '',
    accent: '#000',
    onAccent: '#fff',
    status: 'ready',
    sections: [
      { id: 's1', title: 'S1', lessons: [lesson('one'), lesson('two')] },
      { id: 's2', title: 'S2', lessons: [lesson('three')] },
    ],
  },
];

describe('CatalogService', () => {
  let catalog: CatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: TRACK_REGISTRY, useValue: FAKE_TRACKS }] });
    catalog = TestBed.inject(CatalogService);
  });

  it('flattens lessons across sections in reading order', () => {
    expect(catalog.lessons.map((ref) => ref.lesson.id)).toEqual(['one', 'two', 'three']);
  });

  it('finds neighbours across section boundaries', () => {
    const { previous, next } = catalog.neighbours('alpha', 'two');
    expect(previous?.lesson.id).toBe('one');
    expect(next?.lesson.id).toBe('three');
    expect(next?.section.id).toBe('s2');
  });

  it('returns undefined for unknown ids', () => {
    expect(catalog.findLesson('alpha', 'missing')).toBeUndefined();
    expect(catalog.neighbours('nope', 'one')).toEqual({ previous: undefined, next: undefined });
  });
});
