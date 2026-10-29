/**
 * Domain model of the learning catalog.
 * A Track (JavaScript, Angular, ...) contains ordered Sections, a Section contains Lessons.
 * Lesson bodies live outside the bundle in `public/content/<trackId>/<lessonId>.md`,
 * so adding material never requires touching application code.
 */

export const LEVELS = ['basic', 'middle', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS = {
  basic: 'Базовый',
  middle: 'Middle',
  advanced: 'Senior',
} as const satisfies Record<Level, string>;

export type LessonMeta = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly level: Level;
  readonly minutes: number;
  readonly tags: readonly string[];
};

export type Section = {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly [LessonMeta, ...LessonMeta[]];
};

export type TrackStatus = 'ready' | 'planned';

export type Track = {
  readonly id: string;
  readonly title: string;
  /** Short label printed on the spine, e.g. "JS". */
  readonly short: string;
  readonly description: string;
  /** Track identity colour (spine, accents). */
  readonly accent: string;
  /** Text colour that stays readable on top of `accent`. */
  readonly onAccent: string;
  readonly status: TrackStatus;
  readonly sections: readonly Section[];
};

/** A lesson resolved together with its position in the catalog. */
export type LessonRef = {
  readonly track: Track;
  readonly section: Section;
  readonly lesson: LessonMeta;
};

export const lessonKey = (trackId: string, lessonId: string): string => `${trackId}/${lessonId}`;
