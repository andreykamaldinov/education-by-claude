import type { Exercise } from '../../domain/exercise.model';

export const WEB_EXERCISES = [
  {
    id: 'web-cache-control',
    trackId: 'web',
    title: 'Разбор Cache-Control',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'http',
    description: `Напишите \`parseCacheControl(header)\`, разбирающую заголовок в объект, и \`isFresh(header, ageSeconds)\`:

~~~ts
parseCacheControl('public, max-age=3600, immutable');
// { public: true, 'max-age': 3600, immutable: true }
~~~

- директивы без значения → \`true\`, числовые значения → \`number\`, остальные — строки без кавычек;
- регистр директив не важен, пробелы игнорируются;
- \`isFresh\` — \`true\`, если нет \`no-store\`/\`no-cache\` и \`ageSeconds < max-age\`.`,
    starter: `type CacheControl = Record<string, string | number | true>;

function parseCacheControl(header: string): CacheControl {
  return {};
}

function isFresh(header: string, ageSeconds: number): boolean {
  return false;
}
`,
    solution: `type CacheControl = Record<string, string | number | true>;

function parseCacheControl(header: string): CacheControl {
  const result: CacheControl = {};
  for (const part of header.split(',')) {
    const [rawName, ...rawValue] = part.split('=');
    const name = (rawName ?? '').trim().toLowerCase();
    if (!name) continue;
    if (rawValue.length === 0) {
      result[name] = true;
      continue;
    }
    const value = rawValue.join('=').trim().replace(/^"|"$/g, '');
    result[name] = /^\\d+$/.test(value) ? Number(value) : value;
  }
  return result;
}

function isFresh(header: string, ageSeconds: number): boolean {
  const cc = parseCacheControl(header);
  if (cc['no-store'] || cc['no-cache']) return false;
  const maxAge = cc['max-age'];
  return typeof maxAge === 'number' && ageSeconds < maxAge;
}
`,
    tests: [
      { name: 'разбор директив', code: `expect(parseCacheControl('public, max-age=3600, immutable')).toEqual({ public: true, 'max-age': 3600, immutable: true });` },
      { name: 'регистр, пробелы и кавычки', code: `expect(parseCacheControl(' Private ,MAX-AGE=60 , no-cache="Set-Cookie"')).toEqual({ private: true, 'max-age': 60, 'no-cache': 'Set-Cookie' });` },
      { name: 'свежесть', code: `expect(isFresh('max-age=60', 30)).toBe(true);
expect(isFresh('max-age=60', 61)).toBe(false);
expect(isFresh('no-cache, max-age=60', 1)).toBe(false);
expect(isFresh('no-store', 0)).toBe(false);
expect(isFresh('public', 0)).toBe(false);` },
    ],
    hints: ['split(",") по директивам, затем split("=") на имя и значение.'],
  },
  {
    id: 'web-query-string',
    trackId: 'web',
    title: 'Query-строка туда и обратно',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'http',
    description: `Реализуйте пару функций без \`URLSearchParams\`:

- \`stringifyQuery({ q: 'angular signals', tags: ['a', 'b'], page: 2, empty: undefined })\` → \`'q=angular%20signals&tags=a&tags=b&page=2'\` (\`undefined\` и \`null\` пропускаются, массивы — повтором ключа, значения кодируются \`encodeURIComponent\`);
- \`parseQuery('?q=angular%20signals&tags=a&tags=b&flag')\` → \`{ q: 'angular signals', tags: ['a', 'b'], flag: '' }\` (повторяющиеся ключи собираются в массив, ведущий \`?\` необязателен, \`+\` означает пробел).`,
    starter: `type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];

function stringifyQuery(params: Record<string, QueryValue>): string {
  return '';
}

function parseQuery(query: string): Record<string, string | string[]> {
  return {};
}
`,
    solution: `type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];

function stringifyQuery(params: Record<string, QueryValue>): string {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(item)));
    }
  }
  return pairs.join('&');
}

function parseQuery(query: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const pair of query.replace(/^\\?/, '').split('&')) {
    if (!pair) continue;
    const [rawKey, ...rest] = pair.split('=');
    const decode = (s: string) => decodeURIComponent(s.replace(/\\+/g, ' '));
    const key = decode(rawKey ?? '');
    const value = decode(rest.join('='));
    const existing = result[key];
    if (existing === undefined) result[key] = value;
    else result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  }
  return result;
}
`,
    tests: [
      { name: 'stringify', code: `expect(stringifyQuery({ q: 'angular signals', tags: ['a', 'b'], page: 2, empty: undefined, nil: null }))
  .toBe('q=angular%20signals&tags=a&tags=b&page=2');` },
      { name: 'parse', code: `expect(parseQuery('?q=angular%20signals&tags=a&tags=b&flag')).toEqual({ q: 'angular signals', tags: ['a', 'b'], flag: '' });` },
      { name: 'плюс и спецсимволы', code: `expect(parseQuery('city=%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C&text=a+b')).toEqual({ city: 'Казань', text: 'a b' });
expect(stringifyQuery({ expr: 'a&b=c' })).toBe('expr=a%26b%3Dc');` },
      { name: 'туда и обратно', code: `const params = { search: 'кофе & чай', page: 3 };
expect(parseQuery(stringifyQuery(params))).toEqual({ search: 'кофе & чай', page: '3' });` },
    ],
    hints: ['encodeURIComponent и decodeURIComponent решают кодирование; + нужно заменить на пробел до декодирования.'],
  },
  {
    id: 'web-layout-batch',
    trackId: 'web',
    title: 'Без layout thrashing',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'rendering',
    description: `Модель DOM ниже считает, сколько раз браузеру пришлось выполнить layout: каждое **чтение** геометрии после **записи** стиля вызывает принудительный layout.

Функция \`equalizeHeights(elements)\` должна выставить всем элементам высоту, равную максимальной. Текущая реализация чередует чтение и запись. Перепишите её так, чтобы layout выполнялся **не более одного раза** при любом количестве элементов.`,
    starter: `class FakeElement {
  static layouts = 0;
  static dirty = false;
  private h: number;
  constructor(height: number) { this.h = height; }
  get offsetHeight(): number {
    if (FakeElement.dirty) { FakeElement.layouts++; FakeElement.dirty = false; }
    return this.h;
  }
  setHeight(px: number): void { this.h = px; FakeElement.dirty = true; }
}

function equalizeHeights(elements: FakeElement[]): void {
  let max = 0;
  for (const el of elements) {
    max = Math.max(max, el.offsetHeight);
    el.setHeight(el.offsetHeight);
  }
  for (const el of elements) {
    el.setHeight(max);
  }
}
`,
    solution: `class FakeElement {
  static layouts = 0;
  static dirty = false;
  private h: number;
  constructor(height: number) { this.h = height; }
  get offsetHeight(): number {
    if (FakeElement.dirty) { FakeElement.layouts++; FakeElement.dirty = false; }
    return this.h;
  }
  setHeight(px: number): void { this.h = px; FakeElement.dirty = true; }
}

function equalizeHeights(elements: FakeElement[]): void {
  // Сначала все чтения…
  const max = Math.max(0, ...elements.map((el) => el.offsetHeight));
  // …потом все записи
  for (const el of elements) {
    el.setHeight(max);
  }
}
`,
    tests: [
      { name: 'высоты выровнены', code: `FakeElement.layouts = 0; FakeElement.dirty = false;
const items = [10, 40, 25].map((h) => new FakeElement(h));
equalizeHeights(items);
expect(items.map((el) => el.offsetHeight)).toEqual([40, 40, 40]);` },
      { name: 'не больше одного layout', code: `FakeElement.layouts = 0; FakeElement.dirty = false;
const items = Array.from({ length: 50 }, (_, i) => new FakeElement(i));
equalizeHeights(items);
expect(FakeElement.layouts).toBeLessThan(2);` },
    ],
    hints: ['Сгруппируйте: сначала прочитайте все высоты, затем запишите все значения.'],
  },
] as const satisfies readonly Exercise[];
