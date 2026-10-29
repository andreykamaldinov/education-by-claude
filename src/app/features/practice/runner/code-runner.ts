import { Injectable, InjectionToken, type Provider, inject } from '@angular/core';
import type { RunRequest, RunResult, RuntimeLanguage } from '../../../domain/exercise.model';
import { WorkerCodeRunner } from './worker-code-runner';

/**
 * Strategy contract for executing exercise code.
 * New languages plug in as another multi-provider without touching the practice UI (OCP).
 */
export type CodeRunner = {
  readonly languages: readonly RuntimeLanguage[];
  run(request: RunRequest): Promise<RunResult>;
};

export const CODE_RUNNERS = new InjectionToken<readonly CodeRunner[]>('CODE_RUNNERS');

export const provideCodeRunners = (): Provider[] => [
  { provide: CODE_RUNNERS, useClass: WorkerCodeRunner, multi: true },
];

@Injectable({ providedIn: 'root' })
export class CodeRunnerRegistry {
  private readonly runners = inject(CODE_RUNNERS);

  run(request: RunRequest): Promise<RunResult> {
    const runner = this.runners.find((candidate) => candidate.languages.includes(request.language));
    if (!runner) {
      return Promise.resolve({
        kind: 'compile-error',
        message: `Для языка «${request.language}» не подключён исполнитель`,
        logs: [],
      });
    }
    return runner.run(request);
  }
}
