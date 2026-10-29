import type {
  LogLevel,
  LogLine,
  RunRequest,
  RunResult,
  RuntimeLanguage,
  TestOutcome,
} from '../../../domain/exercise.model';
import { collect, expect, formatValue, sleep, spy } from './assertions';

export type ExecutionEnvironment = {
  readonly transpile: (code: string, language: RuntimeLanguage) => string;
  /** Extra names visible to the solution and tests, e.g. `{ rxjs }`. */
  readonly globals: Readonly<Record<string, unknown>>;
  readonly testTimeoutMs: number;
};

type TestFn = () => unknown;

const isTestFnArray = (value: unknown): value is TestFn[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'function');

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : formatValue(error);

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`тест не завершился за ${ms} мс`)), ms),
    ),
  ]);

const createConsole = (logs: LogLine[]) => {
  const write =
    (level: LogLevel) =>
    (...args: unknown[]): void => {
      logs.push({ level, text: args.map((arg) => formatValue(arg)).join(' ') });
    };
  return { log: write('log'), info: write('info'), warn: write('warn'), error: write('error') };
};

/**
 * Compiles the learner's code together with the tests into a single function scope,
 * then runs each test in order. Pure with respect to the environment, so the same code
 * powers the browser worker and the Node verification script.
 */
export const executeTests = async (
  request: RunRequest,
  env: ExecutionEnvironment,
): Promise<RunResult> => {
  const logs: LogLine[] = [];
  const startedAt = performance.now();
  let tests: TestFn[];

  try {
    const compiled = env.transpile(request.code, request.language);
    const testBodies = request.tests.map((test) => `async () => {\n${test.code}\n}`).join(',\n');
    const globalNames = Object.keys(env.globals);
    const factory = new Function(
      ...globalNames,
      'expect',
      'collect',
      'sleep',
      'spy',
      'console',
      `"use strict";\n${compiled}\n;return [\n${testBodies}\n];`,
    );
    const produced: unknown = factory(
      ...Object.values(env.globals),
      expect,
      collect,
      sleep,
      spy,
      createConsole(logs),
    );
    if (!isTestFnArray(produced)) {
      return { kind: 'compile-error', message: 'Не удалось собрать тесты', logs };
    }
    tests = produced;
  } catch (error) {
    return { kind: 'compile-error', message: errorMessage(error), logs };
  }

  const outcomes: TestOutcome[] = [];
  for (const [index, test] of tests.entries()) {
    const name = request.tests[index]?.name ?? `Тест ${index + 1}`;
    try {
      await withTimeout(Promise.resolve().then(test), env.testTimeoutMs);
      outcomes.push({ name, status: 'passed' });
    } catch (error) {
      outcomes.push({ name, status: 'failed', message: errorMessage(error) });
    }
  }

  return {
    kind: 'completed',
    tests: outcomes,
    logs,
    durationMs: Math.round(performance.now() - startedAt),
  };
};
