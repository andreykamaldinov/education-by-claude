import type { Exercise } from '../../domain/exercise.model';

export const ANGULAR_EXERCISES = [
  {
    id: 'ng-signals',
    trackId: 'angular',
    title: 'Свои signal, computed и effect',
    level: 'advanced',
    language: 'typescript',
    relatedLessonId: 'signals',
    description: `Реализуйте упрощённую реактивную систему, чтобы понять, как работают сигналы Angular:

- \`signal(initial)\` — функция-геттер с методами \`set(value)\` и \`update(fn)\`; если новое значение равно старому (\`Object.is\`), подписчики не уведомляются;
- \`computed(fn)\` — **ленивое** и **мемоизированное** производное значение: \`fn\` не вызывается, пока значение не прочитали, и не пересчитывается, если зависимости не менялись;
- \`effect(fn)\` — выполняется сразу и повторно (синхронно) при изменении прочитанных сигналов.

Зависимости должны отслеживаться автоматически — по факту чтения сигнала внутри \`computed\`/\`effect\`.`,
    starter: `type Signal<T> = (() => T) & { set(value: T): void; update(fn: (value: T) => T): void };

function signal<T>(initial: T): Signal<T> {
  throw new Error('не реализовано');
}

function computed<T>(fn: () => T): () => T {
  throw new Error('не реализовано');
}

function effect(fn: () => void): void {
  throw new Error('не реализовано');
}
`,
    solution: `type Signal<T> = (() => T) & { set(value: T): void; update(fn: (value: T) => T): void };

type Consumer = { markDirty(): void };

let activeConsumer: Consumer | null = null;

function track(consumers: Set<Consumer>): void {
  if (activeConsumer) consumers.add(activeConsumer);
}

function signal<T>(initial: T): Signal<T> {
  let value = initial;
  const consumers = new Set<Consumer>();
  const read = () => {
    track(consumers);
    return value;
  };
  const set = (next: T) => {
    if (Object.is(next, value)) return;
    value = next;
    [...consumers].forEach((consumer) => consumer.markDirty());
  };
  return Object.assign(read, { set, update: (fn: (current: T) => T) => set(fn(value)) });
}

function computed<T>(fn: () => T): () => T {
  let value: T;
  let dirty = true;
  const consumers = new Set<Consumer>();
  const self: Consumer = {
    markDirty() {
      if (dirty) return;
      dirty = true;
      [...consumers].forEach((consumer) => consumer.markDirty());
    },
  };
  return () => {
    track(consumers);
    if (dirty) {
      const previous = activeConsumer;
      activeConsumer = self;
      try {
        value = fn();
      } finally {
        activeConsumer = previous;
      }
      dirty = false;
    }
    return value;
  };
}

function effect(fn: () => void): void {
  const self: Consumer = {
    markDirty() {
      run();
    },
  };
  const run = () => {
    const previous = activeConsumer;
    activeConsumer = self;
    try {
      fn();
    } finally {
      activeConsumer = previous;
    }
  };
  run();
}
`,
    tests: [
      { name: 'signal: чтение, set, update', code: `const count = signal(1);
count.set(5);
count.update((n) => n + 1);
expect(count()).toBe(6);` },
      { name: 'computed пересчитывается при изменении зависимостей', code: `const a = signal(2);
const b = signal(3);
const sum = computed(() => a() + b());
expect(sum()).toBe(5);
a.set(10);
expect(sum()).toBe(13);` },
      { name: 'computed ленивый и мемоизированный', code: `const source = signal(1);
const fn = spy(() => source() * 2);
const doubled = computed(fn);
expect(fn.calls).toHaveLength(0);
doubled(); doubled();
expect(fn.calls).toHaveLength(1);
source.set(2);
expect(fn.calls).toHaveLength(1);
expect(doubled()).toBe(4);
expect(fn.calls).toHaveLength(2);` },
      { name: 'effect реагирует на изменения', code: `const name = signal('Анна');
const log = [];
effect(() => log.push(name()));
name.set('Олег');
expect(log).toEqual(['Анна', 'Олег']);` },
      { name: 'одинаковое значение не уведомляет', code: `const value = signal('x');
const runs = spy();
effect(() => { value(); runs(); });
value.set('x');
expect(runs.calls).toHaveLength(1);` },
      { name: 'effect через цепочку computed', code: `const price = signal(100);
const withTax = computed(() => price() * 1.2);
const seen = [];
effect(() => seen.push(withTax()));
price.set(200);
expect(seen).toEqual([120, 240]);` },
    ],
    hints: [
      'Держите глобальную переменную «текущий потребитель»: computed и effect ставят себя туда на время выполнения функции.',
      'Сигнал при чтении добавляет текущего потребителя в свой Set подписчиков; при записи — вызывает у них markDirty().',
      'computed при markDirty только помечает себя грязным и передаёт пометку дальше; пересчёт — при следующем чтении.',
    ],
  },
  {
    id: 'ng-file-size-pipe',
    trackId: 'angular',
    title: 'Пайп форматирования размера файла',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'pipes',
    description: `Реализуйте метод \`transform\` класса \`FileSizePipe\` (в Angular он был бы помечен \`@Pipe({ name: 'fileSize' })\`):

- \`transform(1024)\` → \`'1.0 КБ'\`, \`transform(1536, 2)\` → \`'1.50 КБ'\`;
- байты без дробной части: \`transform(512)\` → \`'512 Б'\`;
- единицы: Б, КБ, МБ, ГБ, ТБ (основание 1024);
- \`null\`, \`undefined\` и отрицательные числа → \`'—'\`.`,
    starter: `class FileSizePipe {
  transform(bytes: number | null | undefined, digits = 1): string {
    return '';
  }
}
`,
    solution: `class FileSizePipe {
  private static readonly UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];

  transform(bytes: number | null | undefined, digits = 1): string {
    if (bytes == null || bytes < 0 || !Number.isFinite(bytes)) return '—';
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < FileSizePipe.UNITS.length - 1) {
      value /= 1024;
      unit += 1;
    }
    const formatted = unit === 0 ? String(Math.round(value)) : value.toFixed(digits);
    return formatted + ' ' + FileSizePipe.UNITS[unit];
  }
}
`,
    tests: [
      { name: 'байты', code: `const pipe = new FileSizePipe();
expect(pipe.transform(512)).toBe('512 Б');
expect(pipe.transform(0)).toBe('0 Б');` },
      { name: 'килобайты и мегабайты', code: `const pipe = new FileSizePipe();
expect(pipe.transform(1024)).toBe('1.0 КБ');
expect(pipe.transform(1536, 2)).toBe('1.50 КБ');
expect(pipe.transform(5 * 1024 * 1024)).toBe('5.0 МБ');` },
      { name: 'граница единиц', code: `expect(new FileSizePipe().transform(1024 ** 5)).toBe('1024.0 ТБ');` },
      { name: 'некорректный ввод', code: `const pipe = new FileSizePipe();
expect(pipe.transform(null)).toBe('—');
expect(pipe.transform(undefined)).toBe('—');
expect(pipe.transform(-1)).toBe('—');` },
    ],
    hints: ['Делите на 1024, пока значение ≥ 1024 и есть следующая единица.'],
  },
  {
    id: 'ng-auth-interceptor',
    trackId: 'angular',
    title: 'Функциональный интерсептор авторизации',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'http-interceptors',
    description: `Ниже — упрощённая модель \`HttpRequest\` (иммутабельная, с \`clone\`). Напишите фабрику \`createAuthInterceptor(getToken, apiUrl)\`, возвращающую интерсептор \`(req, next) => next(req)\`:

- добавляет заголовок \`Authorization: Bearer <token>\` **только** для запросов на \`apiUrl\`;
- если токена нет — запрос уходит без изменений;
- если заголовок \`Authorization\` уже задан — не перезаписывает его;
- исходный запрос не мутируется (только \`clone\`).`,
    starter: `class HttpRequest {
  constructor(
    readonly url: string,
    readonly headers: Readonly<Record<string, string>> = {},
  ) {}

  clone(update: { setHeaders?: Record<string, string> }): HttpRequest {
    return new HttpRequest(this.url, { ...this.headers, ...update.setHeaders });
  }
}

type Next = (req: HttpRequest) => unknown;
type Interceptor = (req: HttpRequest, next: Next) => unknown;

function createAuthInterceptor(getToken: () => string | null, apiUrl: string): Interceptor {
  return (req, next) => next(req);
}
`,
    solution: `class HttpRequest {
  constructor(
    readonly url: string,
    readonly headers: Readonly<Record<string, string>> = {},
  ) {}

  clone(update: { setHeaders?: Record<string, string> }): HttpRequest {
    return new HttpRequest(this.url, { ...this.headers, ...update.setHeaders });
  }
}

type Next = (req: HttpRequest) => unknown;
type Interceptor = (req: HttpRequest, next: Next) => unknown;

function createAuthInterceptor(getToken: () => string | null, apiUrl: string): Interceptor {
  return (req, next) => {
    const token = getToken();
    const isOwnApi = req.url === apiUrl || req.url.startsWith(apiUrl.endsWith('/') ? apiUrl : apiUrl + '/');
    if (!token || !isOwnApi || 'Authorization' in req.headers) {
      return next(req);
    }
    return next(req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }));
  };
}
`,
    tests: [
      { name: 'добавляет токен своему API', code: `const interceptor = createAuthInterceptor(() => 't0k', 'https://api.shop.ru');
const sent = [];
interceptor(new HttpRequest('https://api.shop.ru/orders'), (r) => sent.push(r));
expect(sent[0].headers.Authorization).toBe('Bearer t0k');` },
      { name: 'не отправляет токен чужим доменам', code: `const interceptor = createAuthInterceptor(() => 't0k', 'https://api.shop.ru');
const sent = [];
interceptor(new HttpRequest('https://cdn.other.com/a.js'), (r) => sent.push(r));
interceptor(new HttpRequest('https://api.shop.ru.evil.com/steal'), (r) => sent.push(r));
expect(sent[0].headers.Authorization).toBeUndefined();
expect(sent[1].headers.Authorization).toBeUndefined();` },
      { name: 'без токена запрос не меняется', code: `const interceptor = createAuthInterceptor(() => null, 'https://api.shop.ru');
const original = new HttpRequest('https://api.shop.ru/me');
let sent;
interceptor(original, (r) => { sent = r; });
expect(sent).toBe(original);` },
      { name: 'не мутирует запрос и не перезаписывает заголовок', code: `const interceptor = createAuthInterceptor(() => 'new', 'https://api.shop.ru');
const original = new HttpRequest('https://api.shop.ru/x');
let sent;
interceptor(original, (r) => { sent = r; });
expect(original.headers.Authorization).toBeUndefined();
expect(sent).not.toBe(original);
const preset = new HttpRequest('https://api.shop.ru/x', { Authorization: 'Basic abc' });
interceptor(preset, (r) => { sent = r; });
expect(sent.headers.Authorization).toBe('Basic abc');` },
    ],
    hints: [
      'Проверка startsWith(apiUrl) без завершающего слеша пропустит https://api.shop.ru.evil.com — сравнивайте с apiUrl + "/".',
      'Возвращайте результат next(...) — в Angular это Observable ответа.',
    ],
  },
  {
    id: 'ng-injector',
    trackId: 'angular',
    title: 'Мини-инжектор зависимостей',
    level: 'advanced',
    language: 'typescript',
    relatedLessonId: 'dependency-injection',
    description: `Реализуйте класс \`Injector\` — упрощённую модель DI Angular.

~~~ts
const injector = new Injector([
  { provide: API_URL, useValue: '/api' },
  { provide: Http, useClass: Http },
  { provide: UserService, useClass: UserService, deps: [Http, API_URL] },
  { provide: NOW, useFactory: (clock) => clock.now(), deps: [Clock] },
], parentInjector);
~~~

- \`get(token)\` возвращает экземпляр; в пределах инжектора — **один** экземпляр на токен (кеш);
- \`deps\` — токены, которые передаются в конструктор (\`useClass\`) или фабрику (\`useFactory\`);
- если провайдера нет — искать в родителе; если нет нигде — бросить ошибку с текстом \`No provider for <имя>\`;
- токен — класс или объект \`new InjectionToken('описание')\`; имя для ошибки — \`token.name\` или \`token.description\`.`,
    starter: `class InjectionToken<T> {
  constructor(readonly description: string) {}
}

type Token = { name?: string; description?: string } | (new (...args: any[]) => unknown);
type Provider =
  | { provide: Token; useValue: unknown }
  | { provide: Token; useClass: new (...args: any[]) => unknown; deps?: Token[] }
  | { provide: Token; useFactory: (...args: any[]) => unknown; deps?: Token[] };

class Injector {
  constructor(providers: Provider[], private readonly parent?: Injector) {}

  get(token: Token): any {
    throw new Error('не реализовано');
  }
}
`,
    solution: `class InjectionToken<T> {
  constructor(readonly description: string) {}
}

type Token = { name?: string; description?: string } | (new (...args: any[]) => unknown);
type Provider =
  | { provide: Token; useValue: unknown }
  | { provide: Token; useClass: new (...args: any[]) => unknown; deps?: Token[] }
  | { provide: Token; useFactory: (...args: any[]) => unknown; deps?: Token[] };

class Injector {
  private readonly providers = new Map<Token, Provider>();
  private readonly instances = new Map<Token, unknown>();

  constructor(providers: Provider[], private readonly parent?: Injector) {
    providers.forEach((provider) => this.providers.set(provider.provide, provider));
  }

  get(token: Token): any {
    if (this.instances.has(token)) return this.instances.get(token);
    const provider = this.providers.get(token);
    if (!provider) {
      if (this.parent) return this.parent.get(token);
      const name = ('description' in token && token.description) || token.name || 'unknown';
      throw new Error('No provider for ' + name);
    }
    const instance = this.create(provider);
    this.instances.set(token, instance);
    return instance;
  }

  private create(provider: Provider): unknown {
    if ('useValue' in provider) return provider.useValue;
    const deps = (provider.deps ?? []).map((dep) => this.get(dep));
    if ('useClass' in provider) return new provider.useClass(...deps);
    return provider.useFactory(...deps);
  }
}
`,
    tests: [
      { name: 'useValue и useClass с deps', code: `const API_URL = new InjectionToken('API_URL');
class Http {}
class UserService { constructor(http, url) { this.http = http; this.url = url; } }
const injector = new Injector([
  { provide: API_URL, useValue: '/api' },
  { provide: Http, useClass: Http },
  { provide: UserService, useClass: UserService, deps: [Http, API_URL] },
]);
const users = injector.get(UserService);
expect(users.url).toBe('/api');
expect(users.http).toBeInstanceOf(Http);` },
      { name: 'один экземпляр на инжектор', code: `class Store {}
const injector = new Injector([{ provide: Store, useClass: Store }]);
expect(injector.get(Store)).toBe(injector.get(Store));` },
      { name: 'useFactory', code: `const NOW = new InjectionToken('NOW');
class Clock { now() { return 42; } }
const injector = new Injector([
  { provide: Clock, useClass: Clock },
  { provide: NOW, useFactory: (clock) => clock.now(), deps: [Clock] },
]);
expect(injector.get(NOW)).toBe(42);` },
      { name: 'поиск в родителе и переопределение', code: `const THEME = new InjectionToken('THEME');
const LOCALE = new InjectionToken('LOCALE');
const root = new Injector([{ provide: THEME, useValue: 'light' }, { provide: LOCALE, useValue: 'ru' }]);
const child = new Injector([{ provide: THEME, useValue: 'dark' }], root);
expect(child.get(THEME)).toBe('dark');
expect(child.get(LOCALE)).toBe('ru');
expect(root.get(THEME)).toBe('light');` },
      { name: 'ошибка без провайдера', code: `class Missing {}
const TOKEN = new InjectionToken('PAYMENT_GATEWAY');
const injector = new Injector([], new Injector([]));
expect(() => injector.get(Missing)).toThrow('No provider for Missing');
expect(() => injector.get(TOKEN)).toThrow('No provider for PAYMENT_GATEWAY');` },
    ],
    hints: [
      'Две Map: токен → провайдер и токен → созданный экземпляр.',
      'Зависимости из deps получайте рекурсивно через this.get — тогда работает и поиск в родителе.',
      'Различать виды провайдеров удобно оператором in: "useValue" in provider.',
    ],
  },
  {
    id: 'ng-route-match',
    trackId: 'angular',
    title: 'Сопоставление маршрута с параметрами',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'routing',
    description: `Напишите \`matchRoute(pattern, url)\` — упрощённую версию того, что делает роутер Angular:

- \`matchRoute('users/:id', '/users/42')\` → \`{ id: '42' }\`;
- статические сегменты должны совпадать точно, количество сегментов — тоже;
- \`'**'\` совпадает с любым URL → \`{}\`;
- ведущие и завершающие слеши игнорируются, query-строка (\`?tab=1\`) отбрасывается;
- значения параметров декодируются (\`decodeURIComponent\`);
- нет совпадения → \`null\`.`,
    starter: `function matchRoute(pattern: string, url: string): Record<string, string> | null {
  return null;
}
`,
    solution: `const segments = (path: string): string[] => path.split('?')[0]!.split('/').filter(Boolean);

function matchRoute(pattern: string, url: string): Record<string, string> | null {
  if (pattern === '**') return {};
  const patternParts = segments(pattern);
  const urlParts = segments(url);
  if (patternParts.length !== urlParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const expected = patternParts[i]!;
    const actual = urlParts[i]!;
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}
`,
    tests: [
      { name: 'параметры', code: `expect(matchRoute('users/:id/orders/:orderId', '/users/1/orders/7')).toEqual({ id: '1', orderId: '7' });` },
      { name: 'статический маршрут', code: `expect(matchRoute('/settings', '/settings/')).toEqual({});
expect(matchRoute('/settings', '/profile')).toBeNull();` },
      { name: 'разное число сегментов', code: `expect(matchRoute('users/:id', '/users')).toBeNull();
expect(matchRoute('users/:id', '/users/1/edit')).toBeNull();` },
      { name: 'wildcard, query и декодирование', code: `expect(matchRoute('**', '/что/угодно')).toEqual({});
expect(matchRoute('search/:q', '/search/angular%20signals?page=2')).toEqual({ q: 'angular signals' });` },
    ],
    hints: ['Разбейте обе строки на сегменты: split("/").filter(Boolean).', 'Сегмент, начинающийся с «:», — параметр.'],
  },
  {
    id: 'ng-validators',
    trackId: 'angular',
    title: 'Валидаторы формы',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'forms',
    description: `Валидатор Angular — функция \`(control) => ValidationErrors | null\`. Реализуйте:

- \`required\` → \`{ required: true }\` для пустой строки, \`null\`, \`undefined\`, пустого массива;
- \`minLength(n)\` → \`{ minlength: { requiredLength, actualLength } }\` (пустое значение пропускает — за это отвечает required);
- \`passwordStrength\` → \`{ weakPassword: { missing: [...] } }\`, где \`missing\` — список из \`'digit'\`, \`'uppercase'\`, \`'length'\` (не меньше 8);
- \`compose(...validators)\` — объединяет ошибки всех валидаторов в один объект или \`null\`;
- \`fieldsMatch(a, b)\` — валидатор группы: \`{ fieldsMismatch: true }\`, если \`group.value[a] !== group.value[b]\`.`,
    starter: `type Control = { value: unknown };
type ValidationErrors = Record<string, unknown>;
type Validator = (control: Control) => ValidationErrors | null;

const required: Validator = () => null;
const minLength = (n: number): Validator => () => null;
const passwordStrength: Validator = () => null;
const compose = (...validators: Validator[]): Validator => () => null;
const fieldsMatch = (a: string, b: string): Validator => () => null;
`,
    solution: `type Control = { value: unknown };
type ValidationErrors = Record<string, unknown>;
type Validator = (control: Control) => ValidationErrors | null;

const isEmpty = (value: unknown): boolean =>
  value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

const required: Validator = (control) => (isEmpty(control.value) ? { required: true } : null);

const minLength =
  (n: number): Validator =>
  (control) => {
    if (isEmpty(control.value)) return null;
    const length = String(control.value).length;
    return length < n ? { minlength: { requiredLength: n, actualLength: length } } : null;
  };

const passwordStrength: Validator = (control) => {
  const value = typeof control.value === 'string' ? control.value : '';
  const missing: string[] = [];
  if (!/\\d/.test(value)) missing.push('digit');
  if (!/[A-ZА-ЯЁ]/.test(value)) missing.push('uppercase');
  if (value.length < 8) missing.push('length');
  return missing.length > 0 ? { weakPassword: { missing } } : null;
};

const compose =
  (...validators: Validator[]): Validator =>
  (control) => {
    const errors = validators.reduce<ValidationErrors>((all, validator) => ({ ...all, ...(validator(control) ?? {}) }), {});
    return Object.keys(errors).length > 0 ? errors : null;
  };

const fieldsMatch =
  (a: string, b: string): Validator =>
  (group) => {
    const value = (group.value ?? {}) as Record<string, unknown>;
    return value[a] === value[b] ? null : { fieldsMismatch: true };
  };
`,
    tests: [
      { name: 'required', code: `expect(required({ value: '' })).toEqual({ required: true });
expect(required({ value: [] })).toEqual({ required: true });
expect(required({ value: 0 })).toBeNull();
expect(required({ value: 'a' })).toBeNull();` },
      { name: 'minLength', code: `expect(minLength(3)({ value: 'ab' })).toEqual({ minlength: { requiredLength: 3, actualLength: 2 } });
expect(minLength(3)({ value: 'abc' })).toBeNull();
expect(minLength(3)({ value: '' })).toBeNull();` },
      { name: 'passwordStrength', code: `expect(passwordStrength({ value: 'short' })).toEqual({ weakPassword: { missing: ['digit', 'uppercase', 'length'] } });
expect(passwordStrength({ value: 'Пароль2026' })).toBeNull();` },
      { name: 'compose объединяет ошибки', code: `const v = compose(required, minLength(5));
expect(v({ value: '' })).toEqual({ required: true });
expect(v({ value: 'abc' })).toEqual({ minlength: { requiredLength: 5, actualLength: 3 } });
expect(v({ value: 'abcdef' })).toBeNull();` },
      { name: 'fieldsMatch', code: `const v = fieldsMatch('password', 'confirm');
expect(v({ value: { password: 'a', confirm: 'b' } })).toEqual({ fieldsMismatch: true });
expect(v({ value: { password: 'a', confirm: 'a' } })).toBeNull();` },
    ],
    hints: ['Пустое значение для minLength — не ошибка: так валидаторы Angular не дублируют required.', 'compose: reduce по валидаторам со spread результатов.'],
  },
  {
    id: 'ng-track-diff',
    trackId: 'angular',
    title: 'Как работает track в @for',
    level: 'advanced',
    language: 'typescript',
    relatedLessonId: 'defer-performance',
    description: `При обновлении списка \`@for\` сопоставляет старые и новые элементы по выражению \`track\`, чтобы переиспользовать DOM. Реализуйте \`diffByKey(prev, next, key)\`, возвращающую:

~~~ts
{
  added: string[];    // ключи, которых не было
  removed: string[];  // ключи, которых больше нет
  moved: string[];    // ключи, оставшиеся, но изменившие относительный порядок
  kept: string[];     // ключи, оставшиеся на своём относительном месте
}
~~~

«Относительный порядок» — порядок среди элементов, которые есть в обоих списках. Минимальное множество перемещённых элементов — всё, что не входит в наибольшую возрастающую подпоследовательность старых индексов. Для простоты достаточно жадного подхода: элемент считается на месте, если его старый индекс больше старого индекса предыдущего оставшегося «на месте» элемента.`,
    starter: `type Diff = { added: string[]; removed: string[]; moved: string[]; kept: string[] };

function diffByKey<T>(prev: readonly T[], next: readonly T[], key: (item: T) => string): Diff {
  return { added: [], removed: [], moved: [], kept: [] };
}
`,
    solution: `type Diff = { added: string[]; removed: string[]; moved: string[]; kept: string[] };

function diffByKey<T>(prev: readonly T[], next: readonly T[], key: (item: T) => string): Diff {
  const prevIndex = new Map(prev.map((item, index) => [key(item), index]));
  const nextKeys = new Set(next.map(key));
  const diff: Diff = { added: [], removed: [], moved: [], kept: [] };

  for (const item of prev) {
    if (!nextKeys.has(key(item))) diff.removed.push(key(item));
  }

  let lastKeptIndex = -1;
  for (const item of next) {
    const id = key(item);
    const oldIndex = prevIndex.get(id);
    if (oldIndex === undefined) {
      diff.added.push(id);
    } else if (oldIndex > lastKeptIndex) {
      diff.kept.push(id);
      lastKeptIndex = oldIndex;
    } else {
      diff.moved.push(id);
    }
  }
  return diff;
}
`,
    tests: [
      { name: 'добавление и удаление', code: `const prev = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const next = [{ id: 'a' }, { id: 'c' }, { id: 'd' }];
expect(diffByKey(prev, next, (x) => x.id)).toEqual({ added: ['d'], removed: ['b'], moved: [], kept: ['a', 'c'] });` },
      { name: 'перемещение в начало', code: `const ids = (list) => list.map((id) => ({ id }));
const diff = diffByKey(ids(['a', 'b', 'c', 'd']), ids(['d', 'a', 'b', 'c']), (x) => x.id);
expect(diff.kept).toEqual(['d']);
expect(diff.moved).toEqual(['a', 'b', 'c']);` },
      { name: 'новые объекты с теми же ключами не пересоздаются', code: `const prev = [{ id: '1', v: 1 }, { id: '2', v: 1 }];
const next = [{ id: '1', v: 2 }, { id: '2', v: 2 }];
expect(diffByKey(prev, next, (x) => x.id)).toEqual({ added: [], removed: [], moved: [], kept: ['1', '2'] });` },
      { name: 'пустые списки', code: `expect(diffByKey([], [{ id: 'x' }], (x) => x.id).added).toEqual(['x']);
expect(diffByKey([{ id: 'x' }], [], (x) => x.id).removed).toEqual(['x']);` },
    ],
    hints: ['Постройте Map «ключ → старый индекс».', 'Идите по новому списку и сравнивайте старый индекс с последним «оставленным на месте».'],
  },
  {
    id: 'ng-memo-selector',
    trackId: 'angular',
    title: 'Мемоизированный селектор как в NgRx',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'state-management',
    description: `Реализуйте \`createSelector(...inputSelectors, projector)\`:

~~~ts
const selectItems = (s) => s.cart.items;
const selectRate = (s) => s.rate;
const selectTotal = createSelector(selectItems, selectRate, (items, rate) => sum(items) * rate);
~~~

- результат вызова — функция \`(state) => value\`;
- \`projector\` вызывается **только если** результат хотя бы одного входного селектора изменился по ссылке (\`Object.is\`) с прошлого вызова;
- иначе возвращается закешированное значение (та же ссылка).

Это то, что делает селекторы NgRx дешёвыми и почему state нужно обновлять иммутабельно.`,
    starter: `type Selector<S, R> = (state: S) => R;

function createSelector(...args: Array<(...values: any[]) => any>): Selector<any, any> {
  return () => undefined;
}
`,
    solution: `type Selector<S, R> = (state: S) => R;

function createSelector(...args: Array<(...values: any[]) => any>): Selector<any, any> {
  const projector = args[args.length - 1]!;
  const inputs = args.slice(0, -1);
  let lastInputs: unknown[] | null = null;
  let lastResult: unknown;

  return (state) => {
    const values = inputs.map((select) => select(state));
    const changed = lastInputs === null || values.some((value, i) => !Object.is(value, lastInputs![i]));
    if (changed) {
      lastResult = projector(...values);
      lastInputs = values;
    }
    return lastResult;
  };
}
`,
    tests: [
      { name: 'вычисляет значение', code: `const selectTotal = createSelector((s) => s.items, (s) => s.rate, (items, rate) => items.reduce((a, b) => a + b, 0) * rate);
expect(selectTotal({ items: [1, 2, 3], rate: 2 })).toBe(12);` },
      { name: 'кеширует при тех же входах', code: `const projector = spy((items) => items.map((x) => x * 2));
const select = createSelector((s) => s.items, projector);
const items = [1, 2];
const a = select({ items, other: 1 });
const b = select({ items, other: 2 });
expect(a).toBe(b);
expect(projector.calls).toHaveLength(1);` },
      { name: 'пересчитывает при новой ссылке', code: `const projector = spy((items) => items.length);
const select = createSelector((s) => s.items, projector);
select({ items: [1] });
select({ items: [1] });
expect(projector.calls).toHaveLength(2);` },
      { name: 'мутация не видна (поэтому нужна иммутабельность)', code: `const select = createSelector((s) => s.items, (items) => items.length);
const state = { items: [1] };
expect(select(state)).toBe(1);
state.items.push(2);
expect(select(state)).toBe(1);` },
    ],
    hints: ['Последний аргумент — projector, остальные — входные селекторы.', 'Сохраняйте массив прошлых входных значений и сравнивайте поэлементно через Object.is.'],
  },
] as const satisfies readonly Exercise[];
