/** FNV-1a: small, stable string hash used as a shuffle seed. */
const hash = (text: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Mulberry32 PRNG — deterministic for a given seed. */
const random = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * Returns the indices 0..length-1 in an order that depends only on `seed`.
 * Same seed — same order, so answers stay put while the learner reads the explanation.
 */
export const seededOrder = (length: number, seed: string): number[] => {
  const next = random(hash(seed));
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const current = order[i];
    const swap = order[j];
    if (current !== undefined && swap !== undefined) {
      order[i] = swap;
      order[j] = current;
    }
  }
  return order;
};
