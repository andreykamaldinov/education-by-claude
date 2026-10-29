import type { Level } from './catalog.model';

/** Languages the in-browser runner can execute. Extend the union and register a CodeRunner to add more. */
export const RUNTIME_LANGUAGES = ['javascript', 'typescript'] as const;
export type RuntimeLanguage = (typeof RUNTIME_LANGUAGES)[number];

export type ExerciseTest = {
  readonly name: string;
  /** JavaScript that uses `expect`, helpers and the names declared by the solution. */
  readonly code: string;
};

export type Exercise = {
  readonly id: string;
  readonly trackId: string;
  readonly title: string;
  readonly level: Level;
  /** Markdown task statement. */
  readonly description: string;
  readonly language: RuntimeLanguage;
  readonly starter: string;
  readonly solution: string;
  readonly tests: readonly [ExerciseTest, ...ExerciseTest[]];
  readonly hints: readonly string[];
  readonly relatedLessonId?: string;
};

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export type LogLine = {
  readonly level: LogLevel;
  readonly text: string;
};

export type TestOutcome =
  | { readonly name: string; readonly status: 'passed' }
  | { readonly name: string; readonly status: 'failed'; readonly message: string };

export type RunResult =
  | {
      readonly kind: 'completed';
      readonly tests: readonly TestOutcome[];
      readonly logs: readonly LogLine[];
      readonly durationMs: number;
    }
  | { readonly kind: 'compile-error'; readonly message: string; readonly logs: readonly LogLine[] }
  | { readonly kind: 'timeout'; readonly limitMs: number };

export type RunRequest = {
  readonly language: RuntimeLanguage;
  readonly code: string;
  readonly tests: readonly ExerciseTest[];
};

export const isRunPassed = (result: RunResult): boolean =>
  result.kind === 'completed' && result.tests.every((test) => test.status === 'passed');
