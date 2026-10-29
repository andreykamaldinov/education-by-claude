/// <reference lib="webworker" />
import * as rxjs from 'rxjs';
import { transform } from 'sucrase';
import { RUNTIME_LANGUAGES, type RunRequest, type RuntimeLanguage } from '../../../domain/exercise.model';
import { executeTests } from './execute';

const TEST_TIMEOUT_MS = 2500;

const isRuntimeLanguage = (value: unknown): value is RuntimeLanguage =>
  RUNTIME_LANGUAGES.some((language) => language === value);

/** Messages cross a thread boundary: validate before trusting the shape. */
const isRunRequest = (value: unknown): value is RunRequest => {
  if (typeof value !== 'object' || value === null) return false;
  const tests: unknown = Reflect.get(value, 'tests');
  return (
    isRuntimeLanguage(Reflect.get(value, 'language')) &&
    typeof Reflect.get(value, 'code') === 'string' &&
    Array.isArray(tests) &&
    tests.every(
      (test: unknown) =>
        typeof test === 'object' &&
        test !== null &&
        typeof Reflect.get(test, 'name') === 'string' &&
        typeof Reflect.get(test, 'code') === 'string',
    )
  );
};

const transpile = (code: string, language: RuntimeLanguage): string =>
  language === 'typescript'
    ? transform(code, { transforms: ['typescript'], disableESTransforms: true }).code
    : code;

addEventListener('message', (event: MessageEvent<unknown>) => {
  if (!isRunRequest(event.data)) {
    postMessage({ kind: 'compile-error', message: 'Некорректный запрос к песочнице', logs: [] });
    return;
  }
  void executeTests(event.data, {
    transpile,
    globals: { rxjs },
    testTimeoutMs: TEST_TIMEOUT_MS,
  }).then((result) => postMessage(result));
});
