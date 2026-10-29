import { seededOrder } from './seeded-shuffle';
import { slugify } from './slugify';

describe('seededOrder', () => {
  it('returns a permutation of all indices', () => {
    expect([...seededOrder(5, 'q1')].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it('is deterministic for the same seed', () => {
    expect(seededOrder(6, 'question:0')).toEqual(seededOrder(6, 'question:0'));
  });

  it('spreads the first position across different seeds', () => {
    const firstPositions = new Set(Array.from({ length: 40 }, (_, i) => seededOrder(4, `q${i}`)[0]));
    expect(firstPositions.size).toBeGreaterThan(2);
  });
});

describe('slugify', () => {
  it('keeps Cyrillic and collapses punctuation', () => {
    expect(slugify('Как работает Change Detection?')).toBe('как-работает-change-detection');
    expect(slugify('  CSP  и  Trusted Types ')).toBe('csp-и-trusted-types');
  });
});
