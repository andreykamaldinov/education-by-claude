import type { RunRequest } from '../../../domain/exercise.model';
import { executeTests, type ExecutionEnvironment } from './execute';

const env: ExecutionEnvironment = {
  transpile: (code) => code,
  globals: {},
  testTimeoutMs: 200,
};

const request = (code: string, ...tests: string[]): RunRequest => ({
  language: 'javascript',
  code,
  tests: tests.map((test, index) => ({ name: `test ${index + 1}`, code: test })),
});

describe('executeTests', () => {
  it('reports passed and failed tests separately', async () => {
    const result = await executeTests(
      request('function double(n) { return n * 2; }', 'expect(double(2)).toBe(4);', 'expect(double(2)).toBe(5);'),
      env,
    );

    expect(result.kind).toBe('completed');
    if (result.kind !== 'completed') return;
    expect(result.tests.map((test) => test.status)).toEqual(['passed', 'failed']);
    const failed = result.tests[1];
    expect(failed?.status === 'failed' ? failed.message : '').toContain('ожидалось 5, получено 4');
  });

  it('returns a compile error for invalid syntax', async () => {
    const result = await executeTests(request('function (', 'expect(1).toBe(1);'), env);

    expect(result.kind).toBe('compile-error');
  });

  it('captures console output of the learner code', async () => {
    const result = await executeTests(request('console.log("привет", { a: 1 });', 'expect(true).toBeTruthy();'), env);

    expect(result.kind === 'completed' ? result.logs : []).toEqual([{ level: 'log', text: 'привет { a: 1 }' }]);
  });

  it('fails a test that never settles instead of hanging', async () => {
    const result = await executeTests(request('', 'await new Promise(() => {});'), env);

    const outcome = result.kind === 'completed' ? result.tests[0] : undefined;
    expect(outcome?.status).toBe('failed');
  });

  it('exposes configured globals to the code', async () => {
    const result = await executeTests(request('const value = answer * 2;', 'expect(value).toBe(84);'), {
      ...env,
      globals: { answer: 42 },
    });

    expect(result.kind === 'completed' && result.tests.every((t) => t.status === 'passed')).toBe(true);
  });
});
