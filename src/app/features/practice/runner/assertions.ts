/**
 * A tiny Jest-like assertion library for exercises.
 * Framework-free on purpose: it runs inside the Web Worker and in the Node script
 * that verifies every reference solution.
 */

export class AssertionError extends Error {
  override readonly name = 'AssertionError';
}

const MAX_DEPTH = 4;

export const formatValue = (value: unknown, depth = 0, seen = new WeakSet<object>()): string => {
  if (typeof value === 'string') return depth === 0 ? value : JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value);
  if (value === undefined) return 'undefined';
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (seen.has(value)) return '[Circular]';
  if (depth > MAX_DEPTH) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Map) {
    const entries = [...value].map(([k, v]) => `${formatValue(k, depth + 1, seen)} => ${formatValue(v, depth + 1, seen)}`);
    return `Map(${value.size}) { ${entries.join(', ')} }`;
  }
  if (value instanceof Set) {
    return `Set(${value.size}) { ${[...value].map((v) => formatValue(v, depth + 1, seen)).join(', ')} }`;
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => formatValue(v, depth + 1, seen)).join(', ')}]`;
  }
  const entries = Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v, depth + 1, seen)}`);
  const name = value.constructor && value.constructor !== Object ? `${value.constructor.name} ` : '';
  return `${name}{ ${entries.join(', ')} }`;
};

const show = (value: unknown): string => formatValue(value, 1);

export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Map && b instanceof Map) {
    return a.size === b.size && [...a].every(([key, value]) => b.has(key) && deepEqual(value, b.get(key)));
  }
  if (a instanceof Set && b instanceof Set) {
    return a.size === b.size && [...a].every((value) => b.has(value));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => deepEqual(value, b[index]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length &&
    keysA.every((key) => Object.hasOwn(b, key) && deepEqual(Reflect.get(a, key), Reflect.get(b, key)))
  );
};

type Matchers = {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeCloseTo(expected: number, digits?: number): void;
  toContain(expected: unknown): void;
  toHaveLength(expected: number): void;
  toBeInstanceOf(expected: abstract new (...args: never[]) => unknown): void;
  toMatch(expected: RegExp | string): void;
  toThrow(expected?: RegExp | string): void;
};

export type Expectation = Matchers & { readonly not: Matchers };

const lengthOf = (value: unknown): number | undefined => {
  if (typeof value === 'string' || Array.isArray(value)) return value.length;
  if (value instanceof Map || value instanceof Set) return value.size;
  return undefined;
};

const contains = (container: unknown, item: unknown): boolean => {
  if (typeof container === 'string') return typeof item === 'string' && container.includes(item);
  if (Array.isArray(container)) return container.some((element) => deepEqual(element, item));
  if (container instanceof Set) return container.has(item);
  return false;
};

const thrownBy = (fn: unknown): { threw: boolean; error: unknown } => {
  if (typeof fn !== 'function') {
    throw new AssertionError('toThrow ожидает функцию: expect(() => ...).toThrow()');
  }
  try {
    fn();
    return { threw: false, error: undefined };
  } catch (error) {
    return { threw: true, error };
  }
};

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const buildMatchers = (actual: unknown, negate: boolean): Matchers => {
  const check = (pass: boolean, describe: () => string): void => {
    if (pass === negate) {
      throw new AssertionError(negate ? `Ожидалось НЕ: ${describe()}` : describe());
    }
  };

  return {
    toBe: (expected) =>
      check(Object.is(actual, expected), () => `ожидалось ${show(expected)}, получено ${show(actual)}`),
    toEqual: (expected) =>
      check(deepEqual(actual, expected), () => `ожидалось ${show(expected)}, получено ${show(actual)}`),
    toBeTruthy: () => check(Boolean(actual), () => `ожидалось истинное значение, получено ${show(actual)}`),
    toBeFalsy: () => check(!actual, () => `ожидалось ложное значение, получено ${show(actual)}`),
    toBeNull: () => check(actual === null, () => `ожидалось null, получено ${show(actual)}`),
    toBeUndefined: () => check(actual === undefined, () => `ожидалось undefined, получено ${show(actual)}`),
    toBeDefined: () => check(actual !== undefined, () => 'ожидалось значение, получено undefined'),
    toBeGreaterThan: (expected) =>
      check(typeof actual === 'number' && actual > expected, () => `ожидалось > ${expected}, получено ${show(actual)}`),
    toBeLessThan: (expected) =>
      check(typeof actual === 'number' && actual < expected, () => `ожидалось < ${expected}, получено ${show(actual)}`),
    toBeCloseTo: (expected, digits = 2) =>
      check(
        typeof actual === 'number' && Math.abs(actual - expected) < 10 ** -digits / 2,
        () => `ожидалось ≈ ${expected}, получено ${show(actual)}`,
      ),
    toContain: (expected) =>
      check(contains(actual, expected), () => `ожидалось, что ${show(actual)} содержит ${show(expected)}`),
    toHaveLength: (expected) =>
      check(lengthOf(actual) === expected, () => `ожидалась длина ${expected}, получено ${String(lengthOf(actual))}`),
    toBeInstanceOf: (expected) =>
      check(actual instanceof expected, () => `ожидался экземпляр ${expected.name}, получено ${show(actual)}`),
    toMatch: (expected) =>
      check(
        typeof actual === 'string' && (typeof expected === 'string' ? actual.includes(expected) : expected.test(actual)),
        () => `ожидалось совпадение с ${String(expected)}, получено ${show(actual)}`,
      ),
    toThrow: (expected) => {
      const { threw, error } = thrownBy(actual);
      const matches =
        expected === undefined ||
        (typeof expected === 'string' ? messageOf(error).includes(expected) : expected.test(messageOf(error)));
      check(threw && matches, () =>
        threw
          ? `ошибка «${messageOf(error)}» не совпадает с ${String(expected)}`
          : 'ожидалось исключение, но функция завершилась без ошибки',
      );
    },
  };
};

export const expect = (actual: unknown): Expectation => ({
  ...buildMatchers(actual, false),
  not: buildMatchers(actual, true),
});

/* ---------- Helpers available inside tests ---------- */

export type Spy = ((...args: unknown[]) => unknown) & { readonly calls: unknown[][] };

export const spy = (implementation?: (...args: unknown[]) => unknown): Spy => {
  const calls: unknown[][] = [];
  const fn = (...args: unknown[]): unknown => {
    calls.push(args);
    return implementation?.(...args);
  };
  return Object.assign(fn, { calls });
};

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

type Subscribable = {
  subscribe(observer: {
    next: (value: unknown) => void;
    error: (error: unknown) => void;
    complete: () => void;
  }): { unsubscribe(): void };
};

const isSubscribable = (value: unknown): value is Subscribable =>
  typeof value === 'object' && value !== null && typeof Reflect.get(value, 'subscribe') === 'function';

/** Subscribes, collects every emitted value and resolves on complete. */
export const collect = (source: unknown, timeoutMs = 1500): Promise<unknown[]> =>
  new Promise((resolve, reject) => {
    if (!isSubscribable(source)) {
      reject(new AssertionError(`ожидался Observable, получено ${show(source)}`));
      return;
    }
    const values: unknown[] = [];
    const timer = setTimeout(() => {
      subscription.unsubscribe();
      reject(new AssertionError(`поток не завершился за ${timeoutMs} мс. Получено: ${show(values)}`));
    }, timeoutMs);
    const subscription = source.subscribe({
      next: (value) => values.push(value),
      error: (error) => {
        clearTimeout(timer);
        reject(error);
      },
      complete: () => {
        clearTimeout(timer);
        resolve(values);
      },
    });
  });
