import { deepEqual, expect as check, formatValue } from './assertions';

describe('assertions', () => {
  it('compares structures deeply, including Map, Set, Date and NaN', () => {
    expect(deepEqual({ a: [1, { b: NaN }] }, { a: [1, { b: NaN }] })).toBe(true);
    expect(deepEqual(new Map([['k', 1]]), new Map([['k', 1]]))).toBe(true);
    expect(deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(deepEqual(new Date(1), new Date(2))).toBe(false);
    expect(deepEqual([1], { 0: 1 })).toBe(false);
  });

  it('throws readable Russian messages and supports negation', () => {
    expect(() => check(1).toBe(2)).toThrow('ожидалось 2, получено 1');
    expect(() => check([1, 2]).not.toContain(2)).toThrow('Ожидалось НЕ');
    expect(() => check(() => undefined).toThrow()).toThrow('ожидалось исключение');
  });

  it('formats circular structures without crashing', () => {
    const node: Record<string, unknown> = { name: 'root' };
    node['self'] = node;
    expect(formatValue(node)).toContain('[Circular]');
  });
});
