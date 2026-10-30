import type { Exercise } from '../../domain/exercise.model';

export const TYPESCRIPT_EXERCISES = [
  {
    id: 'ts-typed-emitter',
    trackId: 'typescript',
    title: 'Типизированный EventEmitter',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'generics',
    description: `Реализуйте класс \`TypedEmitter<Events>\`, где \`Events\` — карта «имя события → тип данных».

~~~ts
type AppEvents = { login: { userId: string }; logout: undefined };
const bus = new TypedEmitter<AppEvents>();
bus.on('login', (p) => p.userId); // p: { userId: string }
bus.emit('login', { userId: '1' });
~~~

Методы: \`on(event, handler)\` возвращает функцию отписки, \`emit(event, payload)\`, \`listenerCount(event)\`.

Тесты проверяют поведение в рантайме, но постарайтесь, чтобы типы были точными: \`emit('login', 42)\` должен быть ошибкой компиляции.`,
    starter: `class TypedEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    // ваш код
    return () => {};
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // ваш код
  }

  listenerCount(event: keyof Events): number {
    return 0;
  }
}
`,
    solution: `type Handler<T> = (payload: T) => void;

class TypedEmitter<Events extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const set = this.handlers.get(event) ?? new Set<Handler<never>>();
    set.add(handler);
    this.handlers.set(event, set);
    return () => {
      set.delete(handler);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.handlers.get(event);
    set?.forEach((handler) => (handler as Handler<Events[K]>)(payload));
  }

  listenerCount(event: keyof Events): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}
`,
    tests: [
      { name: 'вызывает обработчики с данными', code: `const bus = new TypedEmitter();
const handler = spy();
bus.on('login', handler);
bus.emit('login', { userId: '1' });
expect(handler.calls).toEqual([[{ userId: '1' }]]);` },
      { name: 'отписка', code: `const bus = new TypedEmitter();
const handler = spy();
const off = bus.on('logout', handler);
off();
bus.emit('logout', undefined);
expect(handler.calls).toHaveLength(0);` },
      { name: 'события независимы', code: `const bus = new TypedEmitter();
const a = spy();
bus.on('a', a);
bus.emit('b', 1);
expect(a.calls).toHaveLength(0);` },
      { name: 'listenerCount', code: `const bus = new TypedEmitter();
const off = bus.on('x', () => {});
bus.on('x', () => {});
expect(bus.listenerCount('x')).toBe(2);
off();
expect(bus.listenerCount('x')).toBe(1);
expect(bus.listenerCount('y')).toBe(0);` },
    ],
    hints: ['Храните Map<keyof Events, Set<обработчик>>.', 'Функция отписки — замыкание, удаляющее handler из Set.'],
  },
  {
    id: 'ts-result',
    trackId: 'typescript',
    title: 'Тип Result вместо исключений',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'narrowing',
    description: `Смоделируйте результат операции как discriminated union и напишите хелперы:

~~~ts
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
~~~

- \`ok(value)\` и \`err(error)\` — конструкторы;
- \`mapResult(result, fn)\` — применяет \`fn\` к значению успешного результата, ошибку пропускает как есть;
- \`unwrapOr(result, fallback)\` — значение или запасное значение;
- \`parseAge(input: string)\` — возвращает \`ok(число)\` для целого от 0 до 150, иначе \`err('…')\`.`,
    starter: `type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  throw new Error('не реализовано');
}

function err<E>(error: E): Result<never, E> {
  throw new Error('не реализовано');
}

function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  throw new Error('не реализовано');
}

function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  throw new Error('не реализовано');
}

function parseAge(input: string): Result<number> {
  throw new Error('не реализовано');
}
`,
    solution: `type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

function parseAge(input: string): Result<number> {
  if (!/^\\d+$/.test(input.trim())) return err('Возраст должен быть целым числом');
  const age = Number(input);
  return age <= 150 ? ok(age) : err('Слишком большой возраст');
}
`,
    tests: [
      { name: 'конструкторы', code: `expect(ok(1)).toEqual({ ok: true, value: 1 });
expect(err('x')).toEqual({ ok: false, error: 'x' });` },
      { name: 'mapResult', code: `expect(mapResult(ok(2), (n) => n * 10)).toEqual({ ok: true, value: 20 });
const failure = err('сбой');
expect(mapResult(failure, (n) => n * 10)).toEqual(failure);` },
      { name: 'unwrapOr', code: `expect(unwrapOr(ok('a'), 'b')).toBe('a');
expect(unwrapOr(err('e'), 'b')).toBe('b');` },
      { name: 'parseAge', code: `expect(parseAge('42')).toEqual({ ok: true, value: 42 });
expect(parseAge(' 7 ')).toEqual({ ok: true, value: 7 });
expect(parseAge('abc').ok).toBe(false);
expect(parseAge('-5').ok).toBe(false);
expect(parseAge('4.5').ok).toBe(false);
expect(parseAge('200').ok).toBe(false);` },
    ],
    hints: ['Проверка result.ok сужает тип до нужного варианта.', 'Ошибочный результат в mapResult можно вернуть как есть — его тип Result<never, E> совместим.'],
  },
  {
    id: 'ts-traffic-light',
    trackId: 'typescript',
    title: 'Конечный автомат светофора',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'narrowing',
    description: `Состояние светофора — discriminated union:

~~~ts
type Light =
  | { color: 'red'; secondsLeft: number }
  | { color: 'yellow'; next: 'red' | 'green' }
  | { color: 'green'; pedestrianWaiting: boolean };
~~~

Напишите \`next(light: Light): Light\`:

- red → yellow (\`next: 'green'\`);
- yellow → цвет из поля \`next\`; для red начальное \`secondsLeft = 30\`, для green — \`pedestrianWaiting: false\`;
- green → yellow (\`next: 'red'\`).

Используйте \`switch\` с исчерпывающей проверкой через \`never\`.`,
    starter: `type Light =
  | { color: 'red'; secondsLeft: number }
  | { color: 'yellow'; next: 'red' | 'green' }
  | { color: 'green'; pedestrianWaiting: boolean };

function next(light: Light): Light {
  // ваш код
  return light;
}
`,
    solution: `type Light =
  | { color: 'red'; secondsLeft: number }
  | { color: 'yellow'; next: 'red' | 'green' }
  | { color: 'green'; pedestrianWaiting: boolean };

const assertNever = (value: never): never => {
  throw new Error('Неизвестное состояние: ' + JSON.stringify(value));
};

function next(light: Light): Light {
  switch (light.color) {
    case 'red':
      return { color: 'yellow', next: 'green' };
    case 'yellow':
      return light.next === 'red' ? { color: 'red', secondsLeft: 30 } : { color: 'green', pedestrianWaiting: false };
    case 'green':
      return { color: 'yellow', next: 'red' };
    default:
      return assertNever(light);
  }
}
`,
    tests: [
      { name: 'red → yellow → green', code: `const yellow = next({ color: 'red', secondsLeft: 0 });
expect(yellow).toEqual({ color: 'yellow', next: 'green' });
expect(next(yellow)).toEqual({ color: 'green', pedestrianWaiting: false });` },
      { name: 'green → yellow → red', code: `const yellow = next({ color: 'green', pedestrianWaiting: true });
expect(yellow).toEqual({ color: 'yellow', next: 'red' });
expect(next(yellow)).toEqual({ color: 'red', secondsLeft: 30 });` },
      { name: 'полный цикл возвращается к началу', code: `let light = { color: 'red', secondsLeft: 30 };
for (let i = 0; i < 4; i++) light = next(light);
expect(light).toEqual({ color: 'red', secondsLeft: 30 });` },
    ],
    hints: ['switch (light.color) сужает тип в каждой ветке.', 'В default вызовите функцию, принимающую never.'],
  },
  {
    id: 'ts-undo-history',
    trackId: 'typescript',
    title: 'История с undo/redo',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'generics',
    description: `Напишите \`createHistory<T>(initial: T)\`, возвращающую объект:

- \`present()\` — текущее значение;
- \`set(value)\` — новое значение (очищает ветку redo);
- \`undo()\` / \`redo()\` — переход назад и вперёд, ничего не делают, если некуда;
- \`canUndo()\` / \`canRedo()\`.

Это паттерн хранения снимков состояния — основа undo в редакторах (см. урок о паттерне Command).`,
    starter: `type History<T> = {
  present(): T;
  set(value: T): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
};

function createHistory<T>(initial: T): History<T> {
  // ваш код
  throw new Error('не реализовано');
}
`,
    solution: `type History<T> = {
  present(): T;
  set(value: T): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
};

function createHistory<T>(initial: T): History<T> {
  let past: T[] = [];
  let present = initial;
  let future: T[] = [];

  return {
    present: () => present,
    set(value) {
      past = [...past, present];
      present = value;
      future = [];
    },
    undo() {
      const previous = past.at(-1);
      if (past.length === 0) return;
      future = [present, ...future];
      present = previous as T;
      past = past.slice(0, -1);
    },
    redo() {
      if (future.length === 0) return;
      const [nextValue, ...rest] = future;
      past = [...past, present];
      present = nextValue as T;
      future = rest;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}
`,
    tests: [
      { name: 'set и present', code: `const h = createHistory(1);
h.set(2);
expect(h.present()).toBe(2);` },
      { name: 'undo и redo', code: `const h = createHistory('a');
h.set('b'); h.set('c');
h.undo();
expect(h.present()).toBe('b');
h.undo();
expect(h.present()).toBe('a');
h.redo();
expect(h.present()).toBe('b');` },
      { name: 'set очищает redo', code: `const h = createHistory(0);
h.set(1); h.undo();
expect(h.canRedo()).toBe(true);
h.set(5);
expect(h.canRedo()).toBe(false);
expect(h.present()).toBe(5);` },
      { name: 'границы истории', code: `const h = createHistory('x');
expect(h.canUndo()).toBe(false);
h.undo();
h.redo();
expect(h.present()).toBe('x');` },
    ],
    hints: ['Храните три части: past (массив), present, future (массив).', 'undo переносит present в начало future, а последний элемент past делает present.'],
  },
  {
    id: 'ts-lru-cache',
    trackId: 'typescript',
    title: 'LRU-кеш',
    level: 'advanced',
    language: 'typescript',
    relatedLessonId: 'generics',
    description: `Реализуйте \`LRUCache<K, V>\` с ограниченной вместимостью:

- \`get(key)\` возвращает значение или \`undefined\` и делает ключ «самым свежим»;
- \`set(key, value)\` добавляет или обновляет значение; при превышении вместимости удаляется **давно не использовавшийся** ключ;
- \`size\` — текущее количество элементов.

Обе операции должны работать за O(1). Подсказка: \`Map\` помнит порядок вставки.`,
    starter: `class LRUCache<K, V> {
  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    return undefined;
  }

  set(key: K, value: V): void {}

  get size(): number {
    return 0;
  }
}
`,
    solution: `class LRUCache<K, V> {
  private readonly entries = new Map<K, V>();

  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    if (!this.entries.has(key)) return undefined;
    const value = this.entries.get(key) as V;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value as K;
      this.entries.delete(oldest);
    }
  }

  get size(): number {
    return this.entries.size;
  }
}
`,
    tests: [
      { name: 'вытесняет самый старый ключ', code: `const cache = new LRUCache(2);
cache.set('a', 1); cache.set('b', 2); cache.set('c', 3);
expect(cache.get('a')).toBeUndefined();
expect(cache.get('b')).toBe(2);
expect(cache.size).toBe(2);` },
      { name: 'get обновляет свежесть', code: `const cache = new LRUCache(2);
cache.set('a', 1); cache.set('b', 2);
cache.get('a');
cache.set('c', 3);
expect(cache.get('a')).toBe(1);
expect(cache.get('b')).toBeUndefined();` },
      { name: 'обновление значения не увеличивает размер', code: `const cache = new LRUCache(2);
cache.set('a', 1); cache.set('a', 10);
expect(cache.size).toBe(1);
expect(cache.get('a')).toBe(10);` },
      { name: 'хранит falsy-значения', code: `const cache = new LRUCache(3);
cache.set('zero', 0);
expect(cache.get('zero')).toBe(0);` },
    ],
    hints: ['Чтобы сделать ключ «свежим», удалите и вставьте его заново.', 'Самый старый ключ — первый в map.keys().'],
  },
  {
    id: 'ts-pick-omit',
    trackId: 'typescript',
    title: 'pick и omit с точными типами',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'utility-types',
    description: `Реализуйте функции, соответствующие утилитарным типам:

~~~ts
pick(user, ['id', 'name']); // Pick<User, 'id' | 'name'>
omit(user, ['password']); // Omit<User, 'password'>
~~~

Исходный объект не должен изменяться. Ключи, которых нет в объекте, в результат не попадают.`,
    starter: `function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  throw new Error('не реализовано');
}

function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  throw new Error('не реализовано');
}
`,
    solution: `function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys);
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !excluded.has(key))) as Omit<T, K>;
}
`,
    tests: [
      { name: 'pick', code: `const user = { id: 1, name: 'Анна', password: 'secret' };
expect(pick(user, ['id', 'name'])).toEqual({ id: 1, name: 'Анна' });` },
      { name: 'omit', code: `const user = { id: 1, name: 'Анна', password: 'secret' };
expect(omit(user, ['password'])).toEqual({ id: 1, name: 'Анна' });` },
      { name: 'исходный объект не меняется', code: `const user = { id: 1, password: 'x' };
omit(user, ['password']);
pick(user, ['id']);
expect(user).toEqual({ id: 1, password: 'x' });` },
      { name: 'отсутствующие ключи не добавляются', code: `const result = pick({ a: 1 }, ['a', 'b']);
expect(Object.keys(result)).toEqual(['a']);` },
    ],
    hints: ['Для omit удобно Object.entries + filter + Object.fromEntries.', 'Здесь допустим as — объект собирается в следующих строках.'],
  },
  {
    id: 'ts-type-guard',
    trackId: 'typescript',
    title: 'Валидация данных на границе',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'narrowing',
    description: `С сервера приходит \`unknown\`. Напишите честный type guard \`isUser(value: unknown): value is User\`:

~~~ts
type User = {
  id: string;
  email: string;
  age: number | null;
  roles: ('admin' | 'editor' | 'viewer')[];
};
~~~

И функцию \`parseUsers(json: string): User[]\`, которая возвращает только валидные записи из JSON-массива (некорректный JSON или не массив — пустой список).`,
    starter: `type Role = 'admin' | 'editor' | 'viewer';
type User = { id: string; email: string; age: number | null; roles: Role[] };

function isUser(value: unknown): value is User {
  return false;
}

function parseUsers(json: string): User[] {
  return [];
}
`,
    solution: `type Role = 'admin' | 'editor' | 'viewer';
type User = { id: string; email: string; age: number | null; roles: Role[] };

const ROLES: readonly string[] = ['admin', 'editor', 'viewer'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isUser(value: unknown): value is User {
  if (!isRecord(value)) return false;
  const { id, email, age, roles } = value;
  return (
    typeof id === 'string' &&
    typeof email === 'string' &&
    email.includes('@') &&
    (age === null || (typeof age === 'number' && Number.isFinite(age))) &&
    Array.isArray(roles) &&
    roles.every((role) => typeof role === 'string' && ROLES.includes(role))
  );
}

function parseUsers(json: string): User[] {
  try {
    const data: unknown = JSON.parse(json);
    return Array.isArray(data) ? data.filter(isUser) : [];
  } catch {
    return [];
  }
}
`,
    tests: [
      { name: 'валидный пользователь', code: `expect(isUser({ id: '1', email: 'a@b.ru', age: 30, roles: ['admin'] })).toBe(true);
expect(isUser({ id: '1', email: 'a@b.ru', age: null, roles: [] })).toBe(true);` },
      { name: 'неверные поля', code: `expect(isUser({ id: 1, email: 'a@b.ru', age: 1, roles: [] })).toBe(false);
expect(isUser({ id: '1', email: 'без собаки', age: 1, roles: [] })).toBe(false);
expect(isUser({ id: '1', email: 'a@b.ru', age: '30', roles: [] })).toBe(false);
expect(isUser({ id: '1', email: 'a@b.ru', age: 1, roles: ['root'] })).toBe(false);` },
      { name: 'не объект', code: `expect(isUser(null)).toBe(false);
expect(isUser('user')).toBe(false);
expect(isUser([])).toBe(false);` },
      { name: 'parseUsers фильтрует и переживает мусор', code: `const json = JSON.stringify([{ id: '1', email: 'a@b.ru', age: 1, roles: [] }, { id: 2 }]);
expect(parseUsers(json)).toHaveLength(1);
expect(parseUsers('{ не json')).toEqual([]);
expect(parseUsers('{"a":1}')).toEqual([]);` },
    ],
    hints: ['Сначала проверьте, что это объект, затем каждое поле.', 'Массив тоже typeof object — исключите его через Array.isArray.'],
  },
  {
    id: 'ts-pipe',
    trackId: 'typescript',
    title: 'Композиция функций pipe',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'generics',
    description: `Напишите \`pipe(...fns)\` — возвращает функцию, которая передаёт значение через функции слева направо:

~~~ts
const slugify = pipe(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\\s+/g, '-'),
);
slugify('  Hello World '); // 'hello-world'
~~~

Без аргументов \`pipe()\` возвращает функцию-идентичность. Так устроен \`pipe\` в RxJS.

Точная типизация \`pipe\` для любого числа функций требует перегрузок (так сделано в RxJS) — здесь достаточно \`any\` в сигнатуре, сосредоточьтесь на реализации.`,
    starter: `function pipe(...fns: Array<(value: any) => any>): (value: any) => any {
  // ваш код
  return (value) => value;
}
`,
    solution: `function pipe(...fns: Array<(value: any) => any>): (value: any) => any {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}
`,
    tests: [
      { name: 'слева направо', code: `const calc = pipe((n) => n + 1, (n) => n * 10);
expect(calc(1)).toBe(20);` },
      { name: 'строки', code: `const slugify = pipe((s) => s.trim(), (s) => s.toLowerCase(), (s) => s.replace(/\\s+/g, '-'));
expect(slugify('  Hello World ')).toBe('hello-world');` },
      { name: 'пустой pipe', code: `expect(pipe()('x')).toBe('x');` },
      { name: 'функции вызываются по одному разу', code: `const f = spy((x) => x);
pipe(f, f)(1);
expect(f.calls).toHaveLength(2);` },
    ],
    hints: ['reduce по массиву функций с начальным значением value.'],
  },
  {
    id: 'ts-money',
    trackId: 'typescript',
    title: 'Value object Money',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'compatibility',
    description: `Деньги нельзя хранить в \`number\` с дробями (\`0.1 + 0.2\`). Реализуйте неизменяемый value object на копейках:

- \`money(amount: number, currency: 'RUB' | 'USD')\` — сумма в рублях/долларах, внутри хранится целое число минимальных единиц (\`minor\`);
- \`add(a, b)\` — сложение, при разных валютах бросает ошибку;
- \`allocate(m, parts)\` — делит сумму на \`parts\` частей так, чтобы сумма частей была равна исходной (остаток копеек распределяется по первым частям);
- \`format(m)\` — строка вида \`'10.50 RUB'\`.`,
    starter: `type Currency = 'RUB' | 'USD';
type Money = { readonly minor: number; readonly currency: Currency };

function money(amount: number, currency: Currency): Money {
  throw new Error('не реализовано');
}

function add(a: Money, b: Money): Money {
  throw new Error('не реализовано');
}

function allocate(m: Money, parts: number): Money[] {
  throw new Error('не реализовано');
}

function format(m: Money): string {
  throw new Error('не реализовано');
}
`,
    solution: `type Currency = 'RUB' | 'USD';
type Money = { readonly minor: number; readonly currency: Currency };

function money(amount: number, currency: Currency): Money {
  return Object.freeze({ minor: Math.round(amount * 100), currency });
}

function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('Нельзя складывать разные валюты');
  return Object.freeze({ minor: a.minor + b.minor, currency: a.currency });
}

function allocate(m: Money, parts: number): Money[] {
  const base = Math.floor(m.minor / parts);
  const remainder = m.minor - base * parts;
  return Array.from({ length: parts }, (_, i) =>
    Object.freeze({ minor: base + (i < remainder ? 1 : 0), currency: m.currency }),
  );
}

function format(m: Money): string {
  return (m.minor / 100).toFixed(2) + ' ' + m.currency;
}
`,
    tests: [
      { name: 'точная арифметика', code: `const sum = add(money(0.1, 'RUB'), money(0.2, 'RUB'));
expect(sum.minor).toBe(30);
expect(format(sum)).toBe('0.30 RUB');` },
      { name: 'разные валюты', code: `expect(() => add(money(1, 'RUB'), money(1, 'USD'))).toThrow('валют');` },
      { name: 'allocate без потери копеек', code: `const parts = allocate(money(100, 'RUB'), 3);
expect(parts.map((p) => p.minor)).toEqual([3334, 3333, 3333]);
expect(parts.reduce((s, p) => s + p.minor, 0)).toBe(10000);` },
      { name: 'неизменяемость', code: `const m = money(5, 'USD');
expect(Object.isFrozen(m)).toBe(true);` },
    ],
    hints: ['Храните целые копейки: Math.round(amount * 100).', 'В allocate остаток от деления раздайте по одной копейке первым частям.'],
  },
  {
    id: 'ts-static-counter',
    trackId: 'typescript',
    title: 'Счётчик экземпляров на static',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'classes',
    description: `Реализуйте класс \`User\`, который сам ведёт учёт своих экземпляров через \`static\`-члены.

- \`new User(name)\` присваивает экземпляру \`readonly id\` по порядку: 1, 2, 3…
- \`static create(name)\` — фабрика: обрезает пробелы, для пустого имени бросает \`Error('Имя обязательно')\`.
- \`static get count\` — сколько экземпляров создано.
- \`static reset()\` — сбрасывает счётчики (нужно тестам).
- Наследник \`class Admin extends User {}\` должен работать без изменений: \`Admin.create('Ира')\` возвращает именно \`Admin\`, а не \`User\`.

~~~ts
User.create('  Анна ').name; // 'Анна'
User.count; // 1
new User('Олег').count; // undefined — static не виден через экземпляр
~~~

Подсказка к последнему пункту: внутри static-метода \`this\` — это конструктор, через который метод вызвали.`,
    starter: `class User {
  readonly id: number;

  constructor(readonly name: string) {
    this.id = 0;
  }

  static create(name: string): User {
    throw new Error('не реализовано');
  }

  static get count(): number {
    return 0;
  }

  static reset(): void {}
}

class Admin extends User {}
`,
    solution: `class User {
  private static nextId = 1;
  private static created = 0;

  readonly id: number;

  constructor(readonly name: string) {
    this.id = User.nextId++;
    User.created++;
  }

  static create<T extends User>(this: new (name: string) => T, name: string): T {
    const trimmed = name.trim();
    if (trimmed === '') {
      throw new Error('Имя обязательно');
    }
    return new this(trimmed);
  }

  static get count(): number {
    return User.created;
  }

  static reset(): void {
    User.nextId = 1;
    User.created = 0;
  }
}

class Admin extends User {}
`,
    tests: [
      { name: 'id выдаются по порядку', code: `User.reset();
const a = new User('a');
const b = new User('b');
expect([a.id, b.id]).toEqual([1, 2]);` },
      { name: 'count считает экземпляры', code: `User.reset();
User.create('a');
new User('b');
expect(User.count).toBe(2);` },
      { name: 'фабрика обрезает пробелы и проверяет имя', code: `User.reset();
expect(User.create('  Анна ').name).toBe('Анна');
expect(() => User.create('   ')).toThrow('Имя обязательно');` },
      { name: 'static не виден через экземпляр', code: `User.reset();
const user = new User('x');
expect(user.count).toBeUndefined();
expect(user.create).toBeUndefined();` },
      { name: 'фабрика наследника создаёт наследника', code: `User.reset();
const admin = Admin.create('Ира');
expect(admin).toBeInstanceOf(Admin);
expect(admin.id).toBe(1);
expect(User.count).toBe(1);` },
      { name: 'reset сбрасывает счётчики', code: `User.reset();
new User('a');
User.reset();
expect(User.count).toBe(0);
expect(new User('b').id).toBe(1);` },
    ],
    hints: [
      'Храните счётчики в private static полях и обращайтесь к ним через User.nextId, а не через this — иначе у Admin появятся свои копии.',
      'Для полиморфной фабрики объявите параметр this: static create<T extends User>(this: new (name: string) => T, name: string): T и вызовите new this(...).',
    ],
  },
  {
    id: 'ts-private-account',
    trackId: 'typescript',
    title: 'Банковский счёт с #private',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'classes',
    description: `Модификатор \`private\` из TypeScript исчезает после компиляции: поле видно в \`JSON.stringify\` и меняется снаружи. Сделайте счёт, у которого баланс защищён по-настоящему — через \`#private\`.

Класс \`BankAccount\`:

- \`constructor(readonly owner: string, initial = 0)\`;
- \`get balance\` — только для чтения, сеттера нет;
- \`deposit(amount)\` и \`withdraw(amount)\` — для суммы ≤ 0 бросают \`RangeError('Сумма должна быть положительной')\`, при нехватке денег \`withdraw\` бросает \`Error('Недостаточно средств')\`;
- \`get history\` — массив операций (\`+100\`, \`-30\` как числа 100 и -30); снаружи изменить историю нельзя — возвращайте копию;
- \`static isAccount(value)\` — проверка через \`#balance in value\`.

В итоге \`JSON.stringify(account)\` должен давать только \`{"owner":"…"}\`.`,
    starter: `class BankAccount {
  balance: number;
  history: number[] = [];

  constructor(readonly owner: string, initial = 0) {
    this.balance = initial;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): void {
    this.balance -= amount;
  }

  static isAccount(value: object): boolean {
    return 'balance' in value;
  }
}
`,
    solution: `class BankAccount {
  #balance: number;
  readonly #history: number[] = [];

  constructor(readonly owner: string, initial = 0) {
    this.#balance = initial;
  }

  get balance(): number {
    return this.#balance;
  }

  get history(): readonly number[] {
    return [...this.#history];
  }

  deposit(amount: number): void {
    this.#assertPositive(amount);
    this.#balance += amount;
    this.#history.push(amount);
  }

  withdraw(amount: number): void {
    this.#assertPositive(amount);
    if (amount > this.#balance) {
      throw new Error('Недостаточно средств');
    }
    this.#balance -= amount;
    this.#history.push(-amount);
  }

  #assertPositive(amount: number): void {
    if (!(amount > 0)) {
      throw new RangeError('Сумма должна быть положительной');
    }
  }

  static isAccount(value: object): value is BankAccount {
    return #balance in value;
  }
}
`,
    tests: [
      { name: 'пополнение и списание', code: `const account = new BankAccount('Анна', 100);
account.deposit(50);
account.withdraw(30);
expect(account.balance).toBe(120);
expect(account.history).toEqual([50, -30]);` },
      { name: 'ошибки валидации', code: `const account = new BankAccount('Анна', 10);
expect(() => account.deposit(0)).toThrow('положительной');
expect(() => account.withdraw(-5)).toThrow('положительной');
expect(() => account.withdraw(11)).toThrow('Недостаточно средств');
expect(account.balance).toBe(10);` },
      { name: 'баланс нельзя присвоить снаружи', code: `const account = new BankAccount('Анна', 10);
expect(() => { account.balance = 1000; }).toThrow();
expect(account.balance).toBe(10);` },
      { name: 'баланс не утекает в JSON и Object.keys', code: `const account = new BankAccount('Анна', 10);
expect(JSON.stringify(account)).toBe('{"owner":"Анна"}');
expect(Object.keys(account)).toEqual(['owner']);` },
      { name: 'история защищена от изменений', code: `const account = new BankAccount('Анна');
account.deposit(5);
account.history.push(1000);
expect(account.history).toEqual([5]);` },
      { name: 'brand check', code: `expect(BankAccount.isAccount(new BankAccount('x'))).toBe(true);
expect(BankAccount.isAccount({ balance: 1, owner: 'x' })).toBe(false);` },
    ],
    hints: [
      'Объявите #balance и #history и дайте к ним только геттеры — присваивание свойству без сеттера в strict mode бросает TypeError.',
      'Повторяющуюся проверку суммы вынесите в приватный метод #assertPositive.',
    ],
  },
  {
    id: 'ts-abstract-shapes',
    trackId: 'typescript',
    title: 'Абстрактные фигуры и protected',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'classes',
    description: `Постройте иерархию фигур на абстрактном классе — это паттерн «шаблонный метод».

~~~ts
abstract class Shape {
  constructor(readonly name: string) {}
  abstract area(): number;
  abstract perimeter(): number;
  describe(): string; // 'круг: S=3.14, P=6.28' — два знака после запятой
  static compareByArea(a: Shape, b: Shape): number; // для sort по возрастанию площади
}
~~~

Наследники:

- \`Circle(radius)\` — имя \`'круг'\`;
- \`Rectangle(width, height)\` — имя \`'прямоугольник'\`, стороны храните в \`protected readonly\` полях;
- \`Square(side) extends Rectangle\` — имя \`'квадрат'\`. Подумайте, как передать имя через конструктор \`Rectangle\`, не делая его публичным параметром.

\`abstract\` защищает только при компиляции. Добавьте рантайм-проверку: \`new Shape('x')\` (например, из JavaScript) должен бросать \`TypeError\`. Используйте \`new.target\`.`,
    starter: `abstract class Shape {
  constructor(readonly name: string) {}

  abstract area(): number;
  abstract perimeter(): number;

  describe(): string {
    return this.name;
  }

  static compareByArea(a: Shape, b: Shape): number {
    return 0;
  }
}

class Circle extends Shape {
  constructor(readonly radius: number) {
    super('круг');
  }
  area(): number {
    return 0;
  }
  perimeter(): number {
    return 0;
  }
}

class Rectangle extends Shape {
  constructor(width: number, height: number) {
    super('прямоугольник');
  }
  area(): number {
    return 0;
  }
  perimeter(): number {
    return 0;
  }
}

class Square extends Rectangle {}
`,
    solution: `abstract class Shape {
  constructor(readonly name: string) {
    if (new.target === Shape) {
      throw new TypeError('Shape — абстрактный класс');
    }
  }

  abstract area(): number;
  abstract perimeter(): number;

  describe(): string {
    return this.name + ': S=' + this.area().toFixed(2) + ', P=' + this.perimeter().toFixed(2);
  }

  static compareByArea(a: Shape, b: Shape): number {
    return a.area() - b.area();
  }
}

class Circle extends Shape {
  constructor(private readonly radius: number) {
    super('круг');
  }

  override area(): number {
    return Math.PI * this.radius ** 2;
  }

  override perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(
    protected readonly width: number,
    protected readonly height: number,
    name = 'прямоугольник',
  ) {
    super(name);
  }

  override area(): number {
    return this.width * this.height;
  }

  override perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

class Square extends Rectangle {
  constructor(side: number) {
    super(side, side, 'квадрат');
  }
}
`,
    tests: [
      { name: 'describe у круга', code: `expect(new Circle(1).describe()).toBe('круг: S=3.14, P=6.28');` },
      { name: 'прямоугольник', code: `const rect = new Rectangle(2, 3);
expect(rect.area()).toBe(6);
expect(rect.describe()).toBe('прямоугольник: S=6.00, P=10.00');` },
      { name: 'квадрат наследует прямоугольник', code: `const square = new Square(4);
expect(square.describe()).toBe('квадрат: S=16.00, P=16.00');
expect(square).toBeInstanceOf(Rectangle);
expect(square).toBeInstanceOf(Shape);` },
      { name: 'сортировка по площади', code: `const shapes = [new Square(3), new Circle(1), new Rectangle(1, 2)];
expect(shapes.sort(Shape.compareByArea).map((s) => s.name)).toEqual(['прямоугольник', 'круг', 'квадрат']);` },
      { name: 'абстрактный класс нельзя создать в рантайме', code: `expect(() => new Shape('x')).toThrow();
expect(() => new Circle(1)).not.toThrow();` },
    ],
    hints: [
      'new.target внутри конструктора — это класс, к которому применили new. Для new Circle() это Circle, для new Shape() — Shape.',
      'Добавьте в Rectangle третий параметр name со значением по умолчанию и передайте его в super(name). Square вызовет super(side, side, \'квадрат\').',
    ],
  },
  {
    id: 'ts-singleton-config',
    trackId: 'typescript',
    title: 'Singleton с приватным конструктором',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'classes',
    description: `Сделайте класс конфигурации \`AppConfig\`, у которого может быть только один экземпляр.

- \`private constructor\` — запрещает \`new AppConfig()\` при компиляции;
- \`static get instance\` — лениво создаёт и всегда возвращает один и тот же экземпляр;
- \`set(key, value)\` возвращает \`this\`, чтобы вызовы можно было цепочкой;
- \`get(key, fallback?)\` — значение или \`fallback\` (по умолчанию \`undefined\`);
- \`static resetForTests()\` — забывает текущий экземпляр.

Модификатор \`private\` у конструктора в JavaScript исчезает. Добавьте рантайм-защиту: вызов \`new AppConfig()\` снаружи должен бросать \`Error('Используйте AppConfig.instance')\`. Подойдёт приватное статическое поле-флаг, которое поднимается только внутри \`instance\`.`,
    starter: `class AppConfig {
  private values = new Map<string, unknown>();

  constructor() {}

  static get instance(): AppConfig {
    return new AppConfig();
  }

  set(key: string, value: unknown): this {
    this.values.set(key, value);
    return this;
  }

  get(key: string, fallback?: unknown): unknown {
    return this.values.get(key);
  }

  static resetForTests(): void {}
}
`,
    solution: `class AppConfig {
  static #instance: AppConfig | undefined;
  static #creating = false;

  readonly #values = new Map<string, unknown>();

  private constructor() {
    if (!AppConfig.#creating) {
      throw new Error('Используйте AppConfig.instance');
    }
  }

  static get instance(): AppConfig {
    if (!AppConfig.#instance) {
      AppConfig.#creating = true;
      try {
        AppConfig.#instance = new AppConfig();
      } finally {
        AppConfig.#creating = false;
      }
    }
    return AppConfig.#instance;
  }

  set(key: string, value: unknown): this {
    this.#values.set(key, value);
    return this;
  }

  get(key: string, fallback?: unknown): unknown {
    return this.#values.has(key) ? this.#values.get(key) : fallback;
  }

  static resetForTests(): void {
    AppConfig.#instance = undefined;
  }
}
`,
    tests: [
      { name: 'один и тот же экземпляр', code: `AppConfig.resetForTests();
expect(AppConfig.instance).toBe(AppConfig.instance);` },
      { name: 'состояние общее', code: `AppConfig.resetForTests();
AppConfig.instance.set('apiUrl', '/api').set('retries', 3);
expect(AppConfig.instance.get('apiUrl')).toBe('/api');
expect(AppConfig.instance.get('retries')).toBe(3);` },
      { name: 'fallback', code: `AppConfig.resetForTests();
expect(AppConfig.instance.get('missing', 42)).toBe(42);
expect(AppConfig.instance.get('missing')).toBeUndefined();
AppConfig.instance.set('zero', 0);
expect(AppConfig.instance.get('zero', 5)).toBe(0);` },
      { name: 'new снаружи запрещён в рантайме', code: `AppConfig.resetForTests();
expect(() => new AppConfig()).toThrow('AppConfig.instance');
expect(AppConfig.instance).toBeInstanceOf(AppConfig);` },
      { name: 'resetForTests создаёт новый экземпляр', code: `AppConfig.resetForTests();
const first = AppConfig.instance;
first.set('a', 1);
AppConfig.resetForTests();
expect(AppConfig.instance).not.toBe(first);
expect(AppConfig.instance.get('a')).toBeUndefined();` },
    ],
    hints: [
      'Храните экземпляр в static #instance и создавайте его только при первом обращении к геттеру.',
      'Флаг static #creating поднимайте прямо перед new внутри instance и опускайте в finally.',
      'Различайте «ключа нет» и «значение равно 0»: используйте Map.has, а не ??.',
    ],
  },
] as const satisfies readonly Exercise[];
