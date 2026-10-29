import { Injectable } from '@angular/core';
import type { RunRequest, RunResult, RuntimeLanguage } from '../../../domain/exercise.model';

const RUN_LIMIT_MS = 6000;

const isRunResult = (value: unknown): value is RunResult => {
  if (typeof value !== 'object' || value === null) return false;
  const kind: unknown = Reflect.get(value, 'kind');
  return kind === 'completed' || kind === 'compile-error' || kind === 'timeout';
};

/**
 * Runs JavaScript/TypeScript in a fresh Web Worker per run.
 * A worker cannot touch the page DOM, and terminating it is the only reliable way
 * to stop `while (true) {}` — which is why the timeout lives here, on the main thread.
 */
@Injectable()
export class WorkerCodeRunner {
  readonly languages: readonly RuntimeLanguage[] = ['javascript', 'typescript'];

  run(request: RunRequest): Promise<RunResult> {
    return new Promise((resolve) => {
      const worker = new Worker(new URL('./runner.worker', import.meta.url), { type: 'module' });
      const finish = (result: RunResult): void => {
        clearTimeout(timer);
        worker.terminate();
        resolve(result);
      };
      const timer = setTimeout(() => finish({ kind: 'timeout', limitMs: RUN_LIMIT_MS }), RUN_LIMIT_MS);

      worker.addEventListener('message', (event: MessageEvent<unknown>) => {
        finish(
          isRunResult(event.data)
            ? event.data
            : { kind: 'compile-error', message: 'Песочница вернула неожиданный ответ', logs: [] },
        );
      });
      worker.addEventListener('error', (event) =>
        finish({ kind: 'compile-error', message: event.message || 'Ошибка песочницы', logs: [] }),
      );
      worker.postMessage(request);
    });
  }
}
