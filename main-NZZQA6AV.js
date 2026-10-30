import{$ as hE,B as _s,C as R_,Ct as vS,E as Ta,Et as xI,G as ea,H as ag,I as Xp,K as ed,L as ZS,M as V_,Ot as ya,P as W,Q as h$2,R as Zu,T as SS,Tt as xC,U as cf,V as aT,X as ff,Y as fc,Z as gS,_ as O_,a as Ea,at as jp,b as P_,bt as td,c as Gm,d as I,et as iC,f as JU,g as MS,h as Lm,ht as qm,i as ES,j as V,k as Up,l as Gw,mt as pS,n as Bm,o as Fm,p as Jm,pt as ov,q as er,r as CS,tt as id,u as H_,ut as nd,v as Oe,w as Rb,wt as va,x as RC,z as _}from"./chunk-Czdnn5p3.js";var i$1=[{id:`ng-signals`,trackId:`angular`,title:`Свои signal, computed и effect`,level:`advanced`,language:`typescript`,relatedLessonId:`signals`,description:"Реализуйте упрощённую реактивную систему, чтобы понять, как работают сигналы Angular:\n\n- `signal(initial)` — функция-геттер с методами `set(value)` и `update(fn)`; если новое значение равно старому (`Object.is`), подписчики не уведомляются;\n- `computed(fn)` — **ленивое** и **мемоизированное** производное значение: `fn` не вызывается, пока значение не прочитали, и не пересчитывается, если зависимости не менялись;\n- `effect(fn)` — выполняется сразу и повторно (синхронно) при изменении прочитанных сигналов.\n\nЗависимости должны отслеживаться автоматически — по факту чтения сигнала внутри `computed`/`effect`.",starter:`type Signal<T> = (() => T) & { set(value: T): void; update(fn: (value: T) => T): void };

function signal<T>(initial: T): Signal<T> {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function computed<T>(fn: () => T): () => T {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function effect(fn: () => void): void {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}
`,solution:`type Signal<T> = (() => T) & { set(value: T): void; update(fn: (value: T) => T): void };

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
`,tests:[{name:`signal: чтение, set, update`,code:`const count = signal(1);
count.set(5);
count.update((n) => n + 1);
expect(count()).toBe(6);`},{name:`computed пересчитывается при изменении зависимостей`,code:`const a = signal(2);
const b = signal(3);
const sum = computed(() => a() + b());
expect(sum()).toBe(5);
a.set(10);
expect(sum()).toBe(13);`},{name:`computed ленивый и мемоизированный`,code:`const source = signal(1);
const fn = spy(() => source() * 2);
const doubled = computed(fn);
expect(fn.calls).toHaveLength(0);
doubled(); doubled();
expect(fn.calls).toHaveLength(1);
source.set(2);
expect(fn.calls).toHaveLength(1);
expect(doubled()).toBe(4);
expect(fn.calls).toHaveLength(2);`},{name:`effect реагирует на изменения`,code:`const name = signal('\u0410\u043D\u043D\u0430');
const log = [];
effect(() => log.push(name()));
name.set('\u041E\u043B\u0435\u0433');
expect(log).toEqual(['\u0410\u043D\u043D\u0430', '\u041E\u043B\u0435\u0433']);`},{name:`одинаковое значение не уведомляет`,code:`const value = signal('x');
const runs = spy();
effect(() => { value(); runs(); });
value.set('x');
expect(runs.calls).toHaveLength(1);`},{name:`effect через цепочку computed`,code:`const price = signal(100);
const withTax = computed(() => price() * 1.2);
const seen = [];
effect(() => seen.push(withTax()));
price.set(200);
expect(seen).toEqual([120, 240]);`}],hints:[`Держите глобальную переменную «текущий потребитель»: computed и effect ставят себя туда на время выполнения функции.`,`Сигнал при чтении добавляет текущего потребителя в свой Set подписчиков; при записи — вызывает у них markDirty().`,`computed при markDirty только помечает себя грязным и передаёт пометку дальше; пересчёт — при следующем чтении.`]},{id:`ng-file-size-pipe`,trackId:`angular`,title:`Пайп форматирования размера файла`,level:`basic`,language:`typescript`,relatedLessonId:`pipes`,description:"Реализуйте метод `transform` класса `FileSizePipe` (в Angular он был бы помечен `@Pipe({ name: 'fileSize' })`):\n\n- `transform(1024)` → `'1.0 КБ'`, `transform(1536, 2)` → `'1.50 КБ'`;\n- байты без дробной части: `transform(512)` → `'512 Б'`;\n- единицы: Б, КБ, МБ, ГБ, ТБ (основание 1024);\n- `null`, `undefined` и отрицательные числа → `'—'`.",starter:`class FileSizePipe {
  transform(bytes: number | null | undefined, digits = 1): string {
    return '';
  }
}
`,solution:`class FileSizePipe {
  private static readonly UNITS = ['\u0411', '\u041A\u0411', '\u041C\u0411', '\u0413\u0411', '\u0422\u0411'];

  transform(bytes: number | null | undefined, digits = 1): string {
    if (bytes == null || bytes < 0 || !Number.isFinite(bytes)) return '\u2014';
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
`,tests:[{name:`байты`,code:`const pipe = new FileSizePipe();
expect(pipe.transform(512)).toBe('512 \u0411');
expect(pipe.transform(0)).toBe('0 \u0411');`},{name:`килобайты и мегабайты`,code:`const pipe = new FileSizePipe();
expect(pipe.transform(1024)).toBe('1.0 \u041A\u0411');
expect(pipe.transform(1536, 2)).toBe('1.50 \u041A\u0411');
expect(pipe.transform(5 * 1024 * 1024)).toBe('5.0 \u041C\u0411');`},{name:`граница единиц`,code:`expect(new FileSizePipe().transform(1024 ** 5)).toBe('1024.0 ТБ');`},{name:`некорректный ввод`,code:`const pipe = new FileSizePipe();
expect(pipe.transform(null)).toBe('\u2014');
expect(pipe.transform(undefined)).toBe('\u2014');
expect(pipe.transform(-1)).toBe('\u2014');`}],hints:[`Делите на 1024, пока значение ≥ 1024 и есть следующая единица.`]},{id:`ng-auth-interceptor`,trackId:`angular`,title:`Функциональный интерсептор авторизации`,level:`middle`,language:`typescript`,relatedLessonId:`http-interceptors`,description:"Ниже — упрощённая модель `HttpRequest` (иммутабельная, с `clone`). Напишите фабрику `createAuthInterceptor(getToken, apiUrl)`, возвращающую интерсептор `(req, next) => next(req)`:\n\n- добавляет заголовок `Authorization: Bearer <token>` **только** для запросов на `apiUrl`;\n- если токена нет — запрос уходит без изменений;\n- если заголовок `Authorization` уже задан — не перезаписывает его;\n- исходный запрос не мутируется (только `clone`).",starter:`class HttpRequest {
  constructor(
  readonly headers: Readonly<Record<string, string>> = {},
    readonly url: string,

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
`,solution:`class HttpRequest {
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
`,tests:[{name:`добавляет токен своему API`,code:`const interceptor = createAuthInterceptor(() => 't0k', 'https://api.shop.ru');
const sent = [];
interceptor(new HttpRequest('https://api.shop.ru/orders'), (r) => sent.push(r));
expect(sent[0].headers.Authorization).toBe('Bearer t0k');`},{name:`не отправляет токен чужим доменам`,code:`const interceptor = createAuthInterceptor(() => 't0k', 'https://api.shop.ru');
const sent = [];
interceptor(new HttpRequest('https://cdn.other.com/a.js'), (r) => sent.push(r));
interceptor(new HttpRequest('https://api.shop.ru.evil.com/steal'), (r) => sent.push(r));
expect(sent[0].headers.Authorization).toBeUndefined();
expect(sent[1].headers.Authorization).toBeUndefined();`},{name:`без токена запрос не меняется`,code:`const interceptor = createAuthInterceptor(() => null, 'https://api.shop.ru');
const original = new HttpRequest('https://api.shop.ru/me');
let sent;
interceptor(original, (r) => { sent = r; });
expect(sent).toBe(original);`},{name:`не мутирует запрос и не перезаписывает заголовок`,code:`const interceptor = createAuthInterceptor(() => 'new', 'https://api.shop.ru');
const original = new HttpRequest('https://api.shop.ru/x');
let sent;
interceptor(original, (r) => { sent = r; });
expect(original.headers.Authorization).toBeUndefined();
expect(sent).not.toBe(original);
const preset = new HttpRequest('https://api.shop.ru/x', { Authorization: 'Basic abc' });
interceptor(preset, (r) => { sent = r; });
expect(sent.headers.Authorization).toBe('Basic abc');`}],hints:[`Проверка startsWith(apiUrl) без завершающего слеша пропустит https://api.shop.ru.evil.com — сравнивайте с apiUrl + "/".`,`Возвращайте результат next(...) — в Angular это Observable ответа.`]},{id:`ng-injector`,trackId:`angular`,title:`Мини-инжектор зависимостей`,level:`advanced`,language:`typescript`,relatedLessonId:`dependency-injection`,description:"Реализуйте класс `Injector` — упрощённую модель DI Angular.\n\n~~~ts\nconst injector = new Injector([\n  { provide: API_URL, useValue: '/api' },\n  { provide: Http, useClass: Http },\n  { provide: UserService, useClass: UserService, deps: [Http, API_URL] },\n  { provide: NOW, useFactory: (clock) => clock.now(), deps: [Clock] },\n], parentInjector);\n~~~\n\n- `get(token)` возвращает экземпляр; в пределах инжектора — **один** экземпляр на токен (кеш);\n- `deps` — токены, которые передаются в конструктор (`useClass`) или фабрику (`useFactory`);\n- если провайдера нет — искать в родителе; если нет нигде — бросить ошибку с текстом `No provider for <имя>`;\n- токен — класс или объект `new InjectionToken('описание')`; имя для ошибки — `token.name` или `token.description`.",starter:`class InjectionToken<T> {
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
    throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
  }
}
`,solution:`class InjectionToken<T> {
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
`,tests:[{name:`useValue и useClass с deps`,code:`const API_URL = new InjectionToken('API_URL');
class Http {}
class UserService { constructor(http, url) { this.http = http; this.url = url; } }
const injector = new Injector([
  { provide: API_URL, useValue: '/api' },
  { provide: Http, useClass: Http },
  { provide: UserService, useClass: UserService, deps: [Http, API_URL] },
]);
const users = injector.get(UserService);
expect(users.url).toBe('/api');
expect(users.http).toBeInstanceOf(Http);`},{name:`один экземпляр на инжектор`,code:`class Store {}
const injector = new Injector([{ provide: Store, useClass: Store }]);
expect(injector.get(Store)).toBe(injector.get(Store));`},{name:`useFactory`,code:`const NOW = new InjectionToken('NOW');
class Clock { now() { return 42; } }
const injector = new Injector([
  { provide: Clock, useClass: Clock },
  { provide: NOW, useFactory: (clock) => clock.now(), deps: [Clock] },
]);
expect(injector.get(NOW)).toBe(42);`},{name:`поиск в родителе и переопределение`,code:`const THEME = new InjectionToken('THEME');
const LOCALE = new InjectionToken('LOCALE');
const root = new Injector([{ provide: THEME, useValue: 'light' }, { provide: LOCALE, useValue: 'ru' }]);
const child = new Injector([{ provide: THEME, useValue: 'dark' }], root);
expect(child.get(THEME)).toBe('dark');
expect(child.get(LOCALE)).toBe('ru');
expect(root.get(THEME)).toBe('light');`},{name:`ошибка без провайдера`,code:`class Missing {}
const TOKEN = new InjectionToken('PAYMENT_GATEWAY');
const injector = new Injector([], new Injector([]));
expect(() => injector.get(Missing)).toThrow('No provider for Missing');
expect(() => injector.get(TOKEN)).toThrow('No provider for PAYMENT_GATEWAY');`}],hints:[`Две Map: токен → провайдер и токен → созданный экземпляр.`,`Зависимости из deps получайте рекурсивно через this.get — тогда работает и поиск в родителе.`,`Различать виды провайдеров удобно оператором in: "useValue" in provider.`]},{id:`ng-route-match`,trackId:`angular`,title:`Сопоставление маршрута с параметрами`,level:`middle`,language:`typescript`,relatedLessonId:`routing`,description:"Напишите `matchRoute(pattern, url)` — упрощённую версию того, что делает роутер Angular:\n\n- `matchRoute('users/:id', '/users/42')` → `{ id: '42' }`;\n- статические сегменты должны совпадать точно, количество сегментов — тоже;\n- `'**'` совпадает с любым URL → `{}`;\n- ведущие и завершающие слеши игнорируются, query-строка (`?tab=1`) отбрасывается;\n- значения параметров декодируются (`decodeURIComponent`);\n- нет совпадения → `null`.",starter:`function matchRoute(pattern: string, url: string): Record<string, string> | null {
  return null;
}
`,solution:`const segments = (path: string): string[] => path.split('?')[0]!.split('/').filter(Boolean);

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
`,tests:[{name:`параметры`,code:`expect(matchRoute('users/:id/orders/:orderId', '/users/1/orders/7')).toEqual({ id: '1', orderId: '7' });`},{name:`статический маршрут`,code:`expect(matchRoute('/settings', '/settings/')).toEqual({});
expect(matchRoute('/settings', '/profile')).toBeNull();`},{name:`разное число сегментов`,code:`expect(matchRoute('users/:id', '/users')).toBeNull();
expect(matchRoute('users/:id', '/users/1/edit')).toBeNull();`},{name:`wildcard, query и декодирование`,code:`expect(matchRoute('**', '/\u0447\u0442\u043E/\u0443\u0433\u043E\u0434\u043D\u043E')).toEqual({});
expect(matchRoute('search/:q', '/search/angular%20signals?page=2')).toEqual({ q: 'angular signals' });`}],hints:[`Разбейте обе строки на сегменты: split("/").filter(Boolean).`,`Сегмент, начинающийся с «:», — параметр.`]},{id:`ng-validators`,trackId:`angular`,title:`Валидаторы формы`,level:`basic`,language:`typescript`,relatedLessonId:`forms`,description:"Валидатор Angular — функция `(control) => ValidationErrors | null`. Реализуйте:\n\n- `required` → `{ required: true }` для пустой строки, `null`, `undefined`, пустого массива;\n- `minLength(n)` → `{ minlength: { requiredLength, actualLength } }` (пустое значение пропускает — за это отвечает required);\n- `passwordStrength` → `{ weakPassword: { missing: [...] } }`, где `missing` — список из `'digit'`, `'uppercase'`, `'length'` (не меньше 8);\n- `compose(...validators)` — объединяет ошибки всех валидаторов в один объект или `null`;\n- `fieldsMatch(a, b)` — валидатор группы: `{ fieldsMismatch: true }`, если `group.value[a] !== group.value[b]`.",starter:`type Control = { value: unknown };
type ValidationErrors = Record<string, unknown>;
type Validator = (control: Control) => ValidationErrors | null;

const required: Validator = () => null;
const minLength = (n: number): Validator => () => null;
const passwordStrength: Validator = () => null;
const compose = (...validators: Validator[]): Validator => () => null;
const fieldsMatch = (a: string, b: string): Validator => () => null;
`,solution:`type Control = { value: unknown };
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
  if (!/[A-Z\u0410-\u042F\u0401]/.test(value)) missing.push('uppercase');
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
`,tests:[{name:`required`,code:`expect(required({ value: '' })).toEqual({ required: true });
expect(required({ value: [] })).toEqual({ required: true });
expect(required({ value: 0 })).toBeNull();
expect(required({ value: 'a' })).toBeNull();`},{name:`minLength`,code:`expect(minLength(3)({ value: 'ab' })).toEqual({ minlength: { requiredLength: 3, actualLength: 2 } });
expect(minLength(3)({ value: 'abc' })).toBeNull();
expect(minLength(3)({ value: '' })).toBeNull();`},{name:`passwordStrength`,code:`expect(passwordStrength({ value: 'short' })).toEqual({ weakPassword: { missing: ['digit', 'uppercase', 'length'] } });
expect(passwordStrength({ value: '\u041F\u0430\u0440\u043E\u043B\u044C2026' })).toBeNull();`},{name:`compose объединяет ошибки`,code:`const v = compose(required, minLength(5));
expect(v({ value: '' })).toEqual({ required: true });
expect(v({ value: 'abc' })).toEqual({ minlength: { requiredLength: 5, actualLength: 3 } });
expect(v({ value: 'abcdef' })).toBeNull();`},{name:`fieldsMatch`,code:`const v = fieldsMatch('password', 'confirm');
expect(v({ value: { password: 'a', confirm: 'b' } })).toEqual({ fieldsMismatch: true });
expect(v({ value: { password: 'a', confirm: 'a' } })).toBeNull();`}],hints:[`Пустое значение для minLength — не ошибка: так валидаторы Angular не дублируют required.`,`compose: reduce по валидаторам со spread результатов.`]},{id:`ng-track-diff`,trackId:`angular`,title:`Как работает track в @for`,level:`advanced`,language:`typescript`,relatedLessonId:`defer-performance`,description:`\u041F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \`@for\` \u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u0442\u0430\u0440\u044B\u0435 \u0438 \u043D\u043E\u0432\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u043F\u043E \u0432\u044B\u0440\u0430\u0436\u0435\u043D\u0438\u044E \`track\`, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C DOM. \u0420\u0435\u0430\u043B\u0438\u0437\u0443\u0439\u0442\u0435 \`diffByKey(prev, next, key)\`, \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E\u0449\u0443\u044E:

~~~ts
{
  added: string[];    // \u043A\u043B\u044E\u0447\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435 \u0431\u044B\u043B\u043E
  removed: string[];  // \u043A\u043B\u044E\u0447\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0442
  moved: string[];    // \u043A\u043B\u044E\u0447\u0438, \u043E\u0441\u0442\u0430\u0432\u0448\u0438\u0435\u0441\u044F, \u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0432\u0448\u0438\u0435 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0440\u044F\u0434\u043E\u043A
  kept: string[];     // \u043A\u043B\u044E\u0447\u0438, \u043E\u0441\u0442\u0430\u0432\u0448\u0438\u0435\u0441\u044F \u043D\u0430 \u0441\u0432\u043E\u0451\u043C \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u043C \u043C\u0435\u0441\u0442\u0435
}
~~~

\xAB\u041E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0440\u044F\u0434\u043E\u043A\xBB \u2014 \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u0440\u0435\u0434\u0438 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0435\u0441\u0442\u044C \u0432 \u043E\u0431\u043E\u0438\u0445 \u0441\u043F\u0438\u0441\u043A\u0430\u0445. \u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043C\u043D\u043E\u0436\u0435\u0441\u0442\u0432\u043E \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0451\u043D\u043D\u044B\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u2014 \u0432\u0441\u0451, \u0447\u0442\u043E \u043D\u0435 \u0432\u0445\u043E\u0434\u0438\u0442 \u0432 \u043D\u0430\u0438\u0431\u043E\u043B\u044C\u0448\u0443\u044E \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430\u044E\u0449\u0443\u044E \u043F\u043E\u0434\u043F\u043E\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0441\u0442\u0430\u0440\u044B\u0445 \u0438\u043D\u0434\u0435\u043A\u0441\u043E\u0432. \u0414\u043B\u044F \u043F\u0440\u043E\u0441\u0442\u043E\u0442\u044B \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0436\u0430\u0434\u043D\u043E\u0433\u043E \u043F\u043E\u0434\u0445\u043E\u0434\u0430: \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043C\u0435\u0441\u0442\u0435, \u0435\u0441\u043B\u0438 \u0435\u0433\u043E \u0441\u0442\u0430\u0440\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u0431\u043E\u043B\u044C\u0448\u0435 \u0441\u0442\u0430\u0440\u043E\u0433\u043E \u0438\u043D\u0434\u0435\u043A\u0441\u0430 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043E\u0441\u0442\u0430\u0432\u0448\u0435\u0433\u043E\u0441\u044F \xAB\u043D\u0430 \u043C\u0435\u0441\u0442\u0435\xBB \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430.`,starter:`type Diff = { added: string[]; removed: string[]; moved: string[]; kept: string[] };

function diffByKey<T>(prev: readonly T[], next: readonly T[], key: (item: T) => string): Diff {
  return { added: [], removed: [], moved: [], kept: [] };
}
`,solution:`type Diff = { added: string[]; removed: string[]; moved: string[]; kept: string[] };

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
`,tests:[{name:`добавление и удаление`,code:`const prev = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const next = [{ id: 'a' }, { id: 'c' }, { id: 'd' }];
expect(diffByKey(prev, next, (x) => x.id)).toEqual({ added: ['d'], removed: ['b'], moved: [], kept: ['a', 'c'] });`},{name:`перемещение в начало`,code:`const ids = (list) => list.map((id) => ({ id }));
const diff = diffByKey(ids(['a', 'b', 'c', 'd']), ids(['d', 'a', 'b', 'c']), (x) => x.id);
expect(diff.kept).toEqual(['d']);
expect(diff.moved).toEqual(['a', 'b', 'c']);`},{name:`новые объекты с теми же ключами не пересоздаются`,code:`const prev = [{ id: '1', v: 1 }, { id: '2', v: 1 }];
const next = [{ id: '1', v: 2 }, { id: '2', v: 2 }];
expect(diffByKey(prev, next, (x) => x.id)).toEqual({ added: [], removed: [], moved: [], kept: ['1', '2'] });`},{name:`пустые списки`,code:`expect(diffByKey([], [{ id: 'x' }], (x) => x.id).added).toEqual(['x']);
expect(diffByKey([{ id: 'x' }], [], (x) => x.id).removed).toEqual(['x']);`}],hints:[`Постройте Map «ключ → старый индекс».`,`Идите по новому списку и сравнивайте старый индекс с последним «оставленным на месте».`]},{id:`ng-memo-selector`,trackId:`angular`,title:`Мемоизированный селектор как в NgRx`,level:`middle`,language:`typescript`,relatedLessonId:`state-management`,description:`\u0420\u0435\u0430\u043B\u0438\u0437\u0443\u0439\u0442\u0435 \`createSelector(...inputSelectors, projector)\`:

~~~ts
const selectItems = (s) => s.cart.items;
const selectRate = (s) => s.rate;
const selectTotal = createSelector(selectItems, selectRate, (items, rate) => sum(items) * rate);
~~~

- \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u044B\u0437\u043E\u0432\u0430 \u2014 \u0444\u0443\u043D\u043A\u0446\u0438\u044F \`(state) => value\`;
- \`projector\` \u0432\u044B\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F **\u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0441\u043B\u0438** \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E\u0433\u043E \u0432\u0445\u043E\u0434\u043D\u043E\u0433\u043E \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0430 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435 (\`Object.is\`) \u0441 \u043F\u0440\u043E\u0448\u043B\u043E\u0433\u043E \u0432\u044B\u0437\u043E\u0432\u0430;
- \u0438\u043D\u0430\u0447\u0435 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u0437\u0430\u043A\u0435\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 (\u0442\u0430 \u0436\u0435 \u0441\u0441\u044B\u043B\u043A\u0430).

\u042D\u0442\u043E \u0442\u043E, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u044B NgRx \u0434\u0435\u0448\u0451\u0432\u044B\u043C\u0438 \u0438 \u043F\u043E\u0447\u0435\u043C\u0443 state \u043D\u0443\u0436\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0442\u044C \u0438\u043C\u043C\u0443\u0442\u0430\u0431\u0435\u043B\u044C\u043D\u043E.`,starter:`type Selector<S, R> = (state: S) => R;

function createSelector(...args: Array<(...values: any[]) => any>): Selector<any, any> {
  return () => undefined;
}
`,solution:`type Selector<S, R> = (state: S) => R;

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
`,tests:[{name:`вычисляет значение`,code:`const selectTotal = createSelector((s) => s.items, (s) => s.rate, (items, rate) => items.reduce((a, b) => a + b, 0) * rate);
expect(selectTotal({ items: [1, 2, 3], rate: 2 })).toBe(12);`},{name:`кеширует при тех же входах`,code:`const projector = spy((items) => items.map((x) => x * 2));
const select = createSelector((s) => s.items, projector);
const items = [1, 2];
const a = select({ items, other: 1 });
const b = select({ items, other: 2 });
expect(a).toBe(b);
expect(projector.calls).toHaveLength(1);`},{name:`пересчитывает при новой ссылке`,code:`const projector = spy((items) => items.length);
const select = createSelector((s) => s.items, projector);
select({ items: [1] });
select({ items: [1] });
expect(projector.calls).toHaveLength(2);`},{name:`мутация не видна (поэтому нужна иммутабельность)`,code:`const select = createSelector((s) => s.items, (items) => items.length);
const state = { items: [1] };
expect(select(state)).toBe(1);
state.items.push(2);
expect(select(state)).toBe(1);`}],hints:[`Последний аргумент — projector, остальные — входные селекторы.`,`Сохраняйте массив прошлых входных значений и сравнивайте поэлементно через Object.is.`]}];var c$1=[{id:`oop-bank-account`,trackId:`oop-solid`,title:`Инкапсуляция: банковский счёт`,level:`basic`,language:`typescript`,relatedLessonId:`oop-principles`,description:"Реализуйте класс `BankAccount`, который защищает свои инварианты:\n\n- баланс хранится в **настоящем** приватном поле (`#balance`) и доступен только через геттер `balance`;\n- `deposit(amount)` и `withdraw(amount)` принимают только положительные конечные числа, иначе бросают `RangeError`;\n- `withdraw` при недостатке средств бросает ошибку с текстом `Недостаточно средств`, баланс не меняется;\n- `history` возвращает **копию** списка операций `{ type: 'deposit' | 'withdraw', amount }` — изменение копии не влияет на счёт.",starter:`type Operation = { type: 'deposit' | 'withdraw'; amount: number };

class BankAccount {
  balance = 0;
  history: Operation[] = [];

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): void {
    this.balance -= amount;
  }
}
`,solution:`type Operation = { type: 'deposit' | 'withdraw'; amount: number };

class BankAccount {
  #balance = 0;
  readonly #operations: Operation[] = [];

  get balance(): number {
    return this.#balance;
  }

  get history(): Operation[] {
    return this.#operations.map((op) => ({ ...op }));
  }

  deposit(amount: number): void {
    this.#assertAmount(amount);
    this.#balance += amount;
    this.#operations.push({ type: 'deposit', amount });
  }

  withdraw(amount: number): void {
    this.#assertAmount(amount);
    if (amount > this.#balance) throw new Error('\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432');
    this.#balance -= amount;
    this.#operations.push({ type: 'withdraw', amount });
  }

  #assertAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) throw new RangeError('\u0421\u0443\u043C\u043C\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0439');
  }
}
`,tests:[{name:`пополнение и списание`,code:`const acc = new BankAccount();
acc.deposit(100);
acc.withdraw(30);
expect(acc.balance).toBe(70);`},{name:`нельзя уйти в минус`,code:`const acc = new BankAccount();
acc.deposit(10);
expect(() => acc.withdraw(50)).toThrow('\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432');
expect(acc.balance).toBe(10);`},{name:`некорректные суммы`,code:`const acc = new BankAccount();
expect(() => acc.deposit(-5)).toThrow();
expect(() => acc.deposit(0)).toThrow();
expect(() => acc.deposit(Infinity)).toThrow();
expect(() => acc.deposit(NaN)).toThrow();`},{name:`баланс нельзя переписать снаружи`,code:`const acc = new BankAccount();
acc.deposit(5);
try { acc.balance = 1000000; } catch {}
expect(acc.balance).toBe(5);
expect(Object.keys(acc)).toEqual([]);`},{name:`history — копия`,code:`const acc = new BankAccount();
acc.deposit(5);
acc.history.push({ type: 'deposit', amount: 999 });
acc.history[0].amount = 1;
expect(acc.history).toEqual([{ type: 'deposit', amount: 5 }]);`}],hints:[`Поля #balance не видны в Object.keys и недоступны снаружи.`,`Для history верните map с копированием объектов.`]},{id:`pat-strategy-shipping`,trackId:`patterns`,title:`Strategy: расчёт доставки`,level:`basic`,language:`typescript`,relatedLessonId:`strategy`,description:"Интернет-магазин считает доставку по-разному. Вместо `switch` реализуйте стратегии и калькулятор:\n\n- `courier`: 300 ₽, бесплатно от суммы заказа 5000 ₽;\n- `pickup`: всегда 0;\n- `post`: 200 ₽ + 50 ₽ за каждый полный или неполный килограмм веса.\n\n`createShippingCalculator(strategies)` возвращает объект с методом `cost(method, order)`, где `order = { total, weightKg }`. Для неизвестного способа — ошибка `Неизвестный способ доставки`. Новые способы должны добавляться **без изменения** калькулятора (OCP).",starter:`type Order = { total: number; weightKg: number };
type ShippingStrategy = { id: string; cost(order: Order): number };

const courier: ShippingStrategy = { id: 'courier', cost: () => 0 };
const pickup: ShippingStrategy = { id: 'pickup', cost: () => 0 };
const post: ShippingStrategy = { id: 'post', cost: () => 0 };

function createShippingCalculator(strategies: ShippingStrategy[]) {
  return {
    cost(method: string, order: Order): number {
      return 0;
    },
  };
}
`,solution:`type Order = { total: number; weightKg: number };
type ShippingStrategy = { id: string; cost(order: Order): number };

const courier: ShippingStrategy = { id: 'courier', cost: (order) => (order.total >= 5000 ? 0 : 300) };
const pickup: ShippingStrategy = { id: 'pickup', cost: () => 0 };
const post: ShippingStrategy = { id: 'post', cost: (order) => 200 + 50 * Math.ceil(order.weightKg) };

function createShippingCalculator(strategies: ShippingStrategy[]) {
  const byId = new Map(strategies.map((strategy) => [strategy.id, strategy]));
  return {
    cost(method: string, order: Order): number {
      const strategy = byId.get(method);
      if (!strategy) throw new Error('\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0441\u043F\u043E\u0441\u043E\u0431 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438: ' + method);
      return strategy.cost(order);
    },
  };
}
`,tests:[{name:`курьер`,code:`const calc = createShippingCalculator([courier, pickup, post]);
expect(calc.cost('courier', { total: 1000, weightKg: 1 })).toBe(300);
expect(calc.cost('courier', { total: 5000, weightKg: 1 })).toBe(0);`},{name:`почта и самовывоз`,code:`const calc = createShippingCalculator([courier, pickup, post]);
expect(calc.cost('post', { total: 100, weightKg: 2.1 })).toBe(350);
expect(calc.cost('pickup', { total: 1, weightKg: 100 })).toBe(0);`},{name:`расширение без изменения калькулятора`,code:`const drone = { id: 'drone', cost: (o) => (o.weightKg <= 2 ? 990 : Infinity) };
const calc = createShippingCalculator([courier, drone]);
expect(calc.cost('drone', { total: 1, weightKg: 1 })).toBe(990);`},{name:`неизвестный способ`,code:`expect(() => createShippingCalculator([pickup]).cost('teleport', { total: 1, weightKg: 1 })).toThrow('Неизвестный способ доставки');`}],hints:[`Стратегия — объект с методом cost.`,`Калькулятор строит Map по id и делегирует расчёт найденной стратегии.`]},{id:`pat-middleware-chain`,trackId:`patterns`,title:`Chain of Responsibility: цепочка middleware`,level:`middle`,language:`typescript`,relatedLessonId:`chain-of-responsibility`,description:"Реализуйте `compose(middlewares, handler)` — то, как устроены интерсепторы Angular и middleware в Express:\n\n~~~ts\ntype Middleware = (req: Req, next: (req: Req) => Res) => Res;\n~~~\n\n- middleware вызываются в порядке массива, каждый получает `next`, вызывающий следующий;\n- последний `next` вызывает `handler`;\n- middleware может изменить запрос, обработать ответ на обратном пути или **не вызывать** `next` и ответить сам.",starter:`type Req = { url: string; headers: Record<string, string> };
type Res = { status: number; body: string };
type Middleware = (req: Req, next: (req: Req) => Res) => Res;

function compose(middlewares: Middleware[], handler: (req: Req) => Res): (req: Req) => Res {
  return handler;
}
`,solution:`type Req = { url: string; headers: Record<string, string> };
type Res = { status: number; body: string };
type Middleware = (req: Req, next: (req: Req) => Res) => Res;

function compose(middlewares: Middleware[], handler: (req: Req) => Res): (req: Req) => Res {
  return middlewares.reduceRight<(req: Req) => Res>((next, middleware) => (req) => middleware(req, next), handler);
}
`,tests:[{name:`порядок вызова туда и обратно`,code:`const log = [];
const a = (req, next) => { log.push('a>'); const res = next(req); log.push('<a'); return res; };
const b = (req, next) => { log.push('b>'); const res = next(req); log.push('<b'); return res; };
compose([a, b], () => { log.push('handler'); return { status: 200, body: '' }; })({ url: '/', headers: {} });
expect(log).toEqual(['a>', 'b>', 'handler', '<b', '<a']);`},{name:`изменение запроса и ответа`,code:`const auth = (req, next) => next({ ...req, headers: { ...req.headers, auth: 'token' } });
const upper = (req, next) => { const res = next(req); return { ...res, body: res.body.toUpperCase() }; };
const run = compose([auth, upper], (req) => ({ status: 200, body: 'auth=' + req.headers.auth }));
expect(run({ url: '/', headers: {} })).toEqual({ status: 200, body: 'AUTH=TOKEN' });`},{name:`досрочный ответ без next`,code:`const handler = spy(() => ({ status: 200, body: 'fresh' }));
const cache = (req, next) => (req.url === '/cached' ? { status: 200, body: 'cache' } : next(req));
const run = compose([cache], handler);
expect(run({ url: '/cached', headers: {} }).body).toBe('cache');
expect(handler.calls).toHaveLength(0);`},{name:`пустая цепочка`,code:`const run = compose([], () => ({ status: 204, body: '' }));
expect(run({ url: '/', headers: {} }).status).toBe(204);`}],hints:[`Соберите цепочку с конца: reduceRight, начальное значение — handler.`]},{id:`pat-query-builder`,trackId:`patterns`,title:`Builder: иммутабельный конструктор запроса`,level:`middle`,language:`typescript`,relatedLessonId:`builder`,description:"Сделайте **иммутабельный** builder параметров запроса к API (как `HttpParams` в Angular): каждый метод возвращает **новый** объект, исходный не меняется.\n\n~~~ts\nconst base = QueryBuilder.create().filter('status', 'active');\nconst page1 = base.page(1, 20).build();\nconst page2 = base.page(2, 20).sort('name', 'desc').build();\n// base по-прежнему без страницы\n~~~\n\n`build()` возвращает строку: фильтры `filter[field]=value` в порядке добавления, затем `page`, `size`, затем `sort=field,dir`. Значения кодируются `encodeURIComponent`. Размер страницы должен быть от 1 до 100, иначе `RangeError`.",starter:`class QueryBuilder {
  static create(): QueryBuilder {
    return new QueryBuilder();
  }

  filter(field: string, value: string): QueryBuilder {
    return this;
  }

  page(page: number, size: number): QueryBuilder {
    return this;
  }

  sort(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder {
    return this;
  }

  build(): string {
    return '';
  }
}
`,solution:`type QueryState = {
  readonly filters: readonly (readonly [string, string])[];
  readonly page?: { readonly page: number; readonly size: number };
  readonly sort?: { readonly field: string; readonly direction: 'asc' | 'desc' };
};

class QueryBuilder {
  private constructor(private readonly state: QueryState) {}

  static create(): QueryBuilder {
    return new QueryBuilder({ filters: [] });
  }

  filter(field: string, value: string): QueryBuilder {
    return new QueryBuilder({ ...this.state, filters: [...this.state.filters, [field, value]] });
  }

  page(page: number, size: number): QueryBuilder {
    if (size < 1 || size > 100) throw new RangeError('\u0420\u0430\u0437\u043C\u0435\u0440 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043E\u0442 1 \u0434\u043E 100');
    return new QueryBuilder({ ...this.state, page: { page, size } });
  }

  sort(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder {
    return new QueryBuilder({ ...this.state, sort: { field, direction } });
  }

  build(): string {
    const enc = encodeURIComponent;
    const parts = this.state.filters.map(([field, value]) => 'filter[' + enc(field) + ']=' + enc(value));
    if (this.state.page) parts.push('page=' + this.state.page.page, 'size=' + this.state.page.size);
    if (this.state.sort) parts.push('sort=' + enc(this.state.sort.field) + ',' + this.state.sort.direction);
    return parts.join('&');
  }
}
`,tests:[{name:`полная сборка`,code:`expect(QueryBuilder.create().filter('status', 'active').page(2, 20).sort('name', 'desc').build())
  .toBe('filter[status]=active&page=2&size=20&sort=name,desc');`},{name:`иммутабельность`,code:`const base = QueryBuilder.create().filter('city', '\u041A\u0430\u0437\u0430\u043D\u044C');
const withPage = base.page(1, 10);
expect(base.build()).toBe('filter[city]=%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C');
expect(withPage).not.toBe(base);
expect(withPage.build()).toContain('page=1');`},{name:`валидация размера`,code:`expect(() => QueryBuilder.create().page(1, 0)).toThrow();
expect(() => QueryBuilder.create().page(1, 500)).toThrow();`},{name:`пустой запрос`,code:`expect(QueryBuilder.create().build()).toBe('');`}],hints:[`Храните состояние в неизменяемом объекте и создавайте новый builder в каждом методе.`]},{id:`arch-dto-mapper`,trackId:`architecture`,title:`Adapter: маппер DTO на границе`,level:`basic`,language:`typescript`,relatedLessonId:`layered-clean`,description:`API \u043E\u0442\u0434\u0430\u0451\u0442 \u0437\u0430\u043A\u0430\u0437\u044B \u0432 \u0441\u0432\u043E\u0451\u043C \u0444\u043E\u0440\u043C\u0430\u0442\u0435. \u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0430\u0434\u0430\u043F\u0442\u0435\u0440 \`toOrder(dto)\`, \u0447\u0442\u043E\u0431\u044B \u0444\u043E\u0440\u043C\u0430\u0442 \u0431\u044D\u043A\u0435\u043D\u0434\u0430 \u043D\u0435 \u043F\u0440\u043E\u0442\u0435\u043A\u0430\u043B \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435:

~~~ts
type OrderDto = {
  order_id: number;
  created_at: string; // ISO
  status_code: 'N' | 'P' | 'S' | 'C';
  items: { sku: string; price_cents: number; qty: number }[];
  customer?: { full_name?: string | null } | null;
};

type Order = {
  id: string;
  createdAt: Date;
  status: 'new' | 'paid' | 'shipped' | 'cancelled';
  total: number; // \u0432 \u0440\u0443\u0431\u043B\u044F\u0445
  customerName: string; // '\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438', \u0435\u0441\u043B\u0438 \u043D\u0435\u0442
};
~~~

\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \`status_code\` \u2014 \u043E\u0448\u0438\u0431\u043A\u0430 \`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441\`.`,starter:`type OrderDto = {
  order_id: number;
  created_at: string;
  status_code: string;
  items: { sku: string; price_cents: number; qty: number }[];
  customer?: { full_name?: string | null } | null;
};

type Order = {
  id: string;
  createdAt: Date;
  status: 'new' | 'paid' | 'shipped' | 'cancelled';
  total: number;
  customerName: string;
};

function toOrder(dto: OrderDto): Order {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}
`,solution:`type OrderDto = {
  order_id: number;
  created_at: string;
  status_code: string;
  items: { sku: string; price_cents: number; qty: number }[];
  customer?: { full_name?: string | null } | null;
};

type Order = {
  id: string;
  createdAt: Date;
  status: 'new' | 'paid' | 'shipped' | 'cancelled';
  total: number;
  customerName: string;
};

const STATUSES: Record<string, Order['status']> = { N: 'new', P: 'paid', S: 'shipped', C: 'cancelled' };

function toOrder(dto: OrderDto): Order {
  const status = STATUSES[dto.status_code];
  if (!status) throw new Error('\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441: ' + dto.status_code);
  const cents = dto.items.reduce((sum, item) => sum + item.price_cents * item.qty, 0);
  return {
    id: String(dto.order_id),
    createdAt: new Date(dto.created_at),
    status,
    total: cents / 100,
    customerName: dto.customer?.full_name?.trim() || '\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438',
  };
}
`,tests:[{name:`полный маппинг`,code:`const order = toOrder({
  order_id: 42, created_at: '2026-10-29T10:00:00Z', status_code: 'P',
  items: [{ sku: 'a', price_cents: 1050, qty: 2 }, { sku: 'b', price_cents: 99, qty: 1 }],
  customer: { full_name: ' \u0410\u043D\u043D\u0430 \u041F\u0435\u0442\u0440\u043E\u0432\u0430 ' },
});
expect(order.id).toBe('42');
expect(order.status).toBe('paid');
expect(order.total).toBe(21.99);
expect(order.customerName).toBe('\u0410\u043D\u043D\u0430 \u041F\u0435\u0442\u0440\u043E\u0432\u0430');
expect(order.createdAt).toBeInstanceOf(Date);
expect(order.createdAt.toISOString()).toBe('2026-10-29T10:00:00.000Z');`},{name:`нет покупателя`,code:`const base = { order_id: 1, created_at: '2026-01-01T00:00:00Z', status_code: 'N', items: [] };
expect(toOrder(base).customerName).toBe('\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438');
expect(toOrder({ ...base, customer: null }).customerName).toBe('\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438');
expect(toOrder({ ...base, customer: { full_name: '  ' } }).customerName).toBe('\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438');`},{name:`неизвестный статус`,code:`expect(() => toOrder({ order_id: 1, created_at: '2026-01-01', status_code: 'X', items: [] })).toThrow('Неизвестный статус');`}],hints:[`Таблица соответствия кодов статусов — Record.`,`Сумму считайте в копейках и делите на 100 в конце.`]},{id:`arch-circuit-breaker`,trackId:`architecture`,title:`Circuit Breaker`,level:`advanced`,language:`typescript`,relatedLessonId:`microservice-patterns`,description:"Реализуйте `CircuitBreaker` вокруг асинхронной операции. Время берётся из переданной функции `now()` — так поведение легко тестировать.\n\n~~~ts\nconst breaker = new CircuitBreaker(callApi, { failureThreshold: 3, resetTimeoutMs: 1000, now: () => Date.now() });\nawait breaker.call(args);\nbreaker.state; // 'closed' | 'open' | 'half-open'\n~~~\n\n- **closed**: вызовы проходят; после `failureThreshold` ошибок **подряд** → `open`; успех сбрасывает счётчик;\n- **open**: вызовы сразу отклоняются ошибкой `Circuit is open` без обращения к операции; по истечении `resetTimeoutMs` следующий вызов переводит в `half-open`;\n- **half-open**: один пробный вызов; успех → `closed`, ошибка → снова `open` (таймер заново).",starter:`type State = 'closed' | 'open' | 'half-open';

class CircuitBreaker<A extends unknown[], R> {
  state: State = 'closed';

  constructor(
    private readonly operation: (...args: A) => Promise<R>,
    private readonly options: { failureThreshold: number; resetTimeoutMs: number; now: () => number },
  ) {}

  call(...args: A): Promise<R> {
    return this.operation(...args);
  }
}
`,solution:`type State = 'closed' | 'open' | 'half-open';

class CircuitBreaker<A extends unknown[], R> {
  state: State = 'closed';
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly operation: (...args: A) => Promise<R>,
    private readonly options: { failureThreshold: number; resetTimeoutMs: number; now: () => number },
  ) {}

  async call(...args: A): Promise<R> {
    if (this.state === 'open') {
      if (this.options.now() - this.openedAt < this.options.resetTimeoutMs) {
        throw new Error('Circuit is open');
      }
      this.state = 'half-open';
    }
    try {
      const result = await this.operation(...args);
      this.state = 'closed';
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures += 1;
      if (this.state === 'half-open' || this.failures >= this.options.failureThreshold) {
        this.state = 'open';
        this.openedAt = this.options.now();
      }
      throw error;
    }
  }
}
`,tests:[{name:`размыкается после порога ошибок`,code:`let time = 0;
const op = spy(async () => { throw new Error('500'); });
const breaker = new CircuitBreaker(op, { failureThreshold: 3, resetTimeoutMs: 1000, now: () => time });
for (let i = 0; i < 3; i++) { try { await breaker.call(); } catch {} }
expect(breaker.state).toBe('open');
let message = '';
try { await breaker.call(); } catch (e) { message = e.message; }
expect(message).toBe('Circuit is open');
expect(op.calls).toHaveLength(3);`},{name:`успех сбрасывает счётчик`,code:`let fail = true;
const breaker = new CircuitBreaker(async () => { if (fail) throw new Error('x'); return 'ok'; }, { failureThreshold: 2, resetTimeoutMs: 100, now: () => 0 });
try { await breaker.call(); } catch {}
fail = false;
await breaker.call();
fail = true;
try { await breaker.call(); } catch {}
expect(breaker.state).toBe('closed');`},{name:`half-open → closed после успеха`,code:`let time = 0;
let fail = true;
const breaker = new CircuitBreaker(async () => { if (fail) throw new Error('x'); return 'ok'; }, { failureThreshold: 1, resetTimeoutMs: 500, now: () => time });
try { await breaker.call(); } catch {}
expect(breaker.state).toBe('open');
time = 600;
fail = false;
expect(await breaker.call()).toBe('ok');
expect(breaker.state).toBe('closed');`},{name:`half-open → open после ошибки`,code:`let time = 0;
const breaker = new CircuitBreaker(async () => { throw new Error('x'); }, { failureThreshold: 1, resetTimeoutMs: 500, now: () => time });
try { await breaker.call(); } catch {}
time = 600;
try { await breaker.call(); } catch {}
expect(breaker.state).toBe('open');
time = 900;
let message = '';
try { await breaker.call(); } catch (e) { message = e.message; }
expect(message).toBe('Circuit is open');`}],hints:[`Храните число ошибок подряд и момент размыкания.`,`В состоянии open проверяйте, прошло ли resetTimeoutMs, прежде чем пробовать.`]},{id:`arch-idempotency`,trackId:`architecture`,title:`Идемпотентный обработчик`,level:`middle`,language:`typescript`,relatedLessonId:`event-driven`,description:"Брокер доставляет сообщения **хотя бы один раз** — дубли возможны. Напишите `idempotent(handler)`: обёртку над асинхронным обработчиком сообщений `{ id, payload }`, которая:\n\n- для повторного сообщения с тем же `id` не вызывает `handler` и возвращает сохранённый результат;\n- если дубль пришёл, пока первый ещё обрабатывается, — ждёт тот же результат (не запускает обработку дважды);\n- если обработка упала, результат не сохраняется — повтор с тем же `id` можно выполнить снова.",starter:`type Message<T> = { id: string; payload: T };

function idempotent<T, R>(handler: (message: Message<T>) => Promise<R>): (message: Message<T>) => Promise<R> {
  return handler;
}
`,solution:`type Message<T> = { id: string; payload: T };

function idempotent<T, R>(handler: (message: Message<T>) => Promise<R>): (message: Message<T>) => Promise<R> {
  const results = new Map<string, Promise<R>>();
  return (message) => {
    const existing = results.get(message.id);
    if (existing) return existing;
    const pending = handler(message).catch((error: unknown) => {
      results.delete(message.id);
      throw error;
    });
    results.set(message.id, pending);
    return pending;
  };
}
`,tests:[{name:`дубль не обрабатывается повторно`,code:`const handler = spy(async (m) => '\u0441\u043F\u0438\u0441\u0430\u043D\u043E ' + m.payload);
const safe = idempotent(handler);
expect(await safe({ id: 'pay-1', payload: 100 })).toBe('\u0441\u043F\u0438\u0441\u0430\u043D\u043E 100');
expect(await safe({ id: 'pay-1', payload: 100 })).toBe('\u0441\u043F\u0438\u0441\u0430\u043D\u043E 100');
expect(handler.calls).toHaveLength(1);`},{name:`параллельный дубль ждёт тот же результат`,code:`const handler = spy((m) => new Promise((r) => setTimeout(() => r(m.id), 20)));
const safe = idempotent(handler);
const [a, b] = await Promise.all([safe({ id: 'x', payload: 1 }), safe({ id: 'x', payload: 1 })]);
expect(a).toBe('x');
expect(b).toBe('x');
expect(handler.calls).toHaveLength(1);`},{name:`после ошибки можно повторить`,code:`let attempt = 0;
const safe = idempotent(async () => { attempt++; if (attempt === 1) throw new Error('\u0441\u0431\u043E\u0439'); return 'ok'; });
try { await safe({ id: 'm', payload: null }); } catch {}
expect(await safe({ id: 'm', payload: null })).toBe('ok');
expect(attempt).toBe(2);`},{name:`разные id обрабатываются независимо`,code:`const handler = spy(async (m) => m.id);
const safe = idempotent(handler);
await safe({ id: 'a', payload: 0 });
await safe({ id: 'b', payload: 0 });
expect(handler.calls).toHaveLength(2);`}],hints:[`Храните промис результата по id сразу, до завершения — тогда параллельный дубль получит тот же промис.`,`В catch удаляйте запись, чтобы ошибка не закешировалась.`]}];var l$1=[{id:`js-debounce`,trackId:`javascript`,title:`Реализуйте debounce`,level:`basic`,language:`javascript`,relatedLessonId:`closures`,description:"Напишите функцию `debounce(fn, ms)`. Она возвращает новую функцию, которая откладывает вызов `fn` до тех пор, пока с момента **последнего** вызова не пройдёт `ms` миллисекунд.\n\n- Если обёртку вызвали несколько раз подряд, `fn` выполнится один раз — с аргументами последнего вызова.\n- Контекст `this` должен передаваться в `fn`.\n\n~~~js\nconst log = debounce((q) => console.log(q), 100);\nlog('a'); log('ab'); log('abc');\n// через 100 мс: 'abc'\n~~~",starter:`function debounce(fn, ms) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
`,tests:[{name:`вызывает функцию один раз после серии вызовов`,code:`const calls = spy();
const debounced = debounce(calls, 30);
debounced(1); debounced(2); debounced(3);
expect(calls.calls).toHaveLength(0);
await sleep(60);
expect(calls.calls).toEqual([[3]]);`},{name:`повторная серия после паузы вызывает функцию снова`,code:`const calls = spy();
const debounced = debounce(calls, 20);
debounced('a');
await sleep(40);
debounced('b');
await sleep(40);
expect(calls.calls).toEqual([['a'], ['b']]);`},{name:`сохраняет контекст this`,code:`const obj = { value: 42, read: null, result: null };
obj.read = debounce(function () { obj.result = this.value; }, 10);
obj.read();
await sleep(30);
expect(obj.result).toBe(42);`}],hints:[`Таймер должен жить в замыкании и переживать вызовы обёртки.`,`При каждом вызове сбрасывайте предыдущий таймер через clearTimeout.`,`Чтобы сохранить this, возвращайте обычную function, а внутри setTimeout используйте стрелку и fn.apply(this, args).`]},{id:`js-throttle`,trackId:`javascript`,title:`Реализуйте throttle`,level:`middle`,language:`javascript`,relatedLessonId:`closures`,description:"Напишите `throttle(fn, ms)`: обёртка вызывает `fn` **сразу** при первом вызове, а затем игнорирует вызовы, пока не пройдёт `ms` миллисекунд.\n\nПосле окончания окна следующий вызов снова выполняется сразу.",starter:`function throttle(fn, ms) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function throttle(fn, ms) {
  let lastCall = -Infinity;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}
`,tests:[{name:`первый вызов выполняется сразу`,code:`const calls = spy();
const throttled = throttle(calls, 50);
throttled('a');
expect(calls.calls).toEqual([['a']]);`},{name:`вызовы внутри окна игнорируются`,code:`const calls = spy();
const throttled = throttle(calls, 50);
throttled(1); throttled(2); throttled(3);
expect(calls.calls).toEqual([[1]]);`},{name:`после окна вызов снова проходит`,code:`const calls = spy();
const throttled = throttle(calls, 30);
throttled(1);
await sleep(50);
throttled(2);
expect(calls.calls).toEqual([[1], [2]]);`}],hints:[`Храните время последнего успешного вызова в замыкании.`,`Date.now() — текущее время в миллисекундах.`]},{id:`js-promise-all`,trackId:`javascript`,title:`Свой Promise.all`,level:`middle`,language:`javascript`,relatedLessonId:`promises`,description:"Реализуйте `promiseAll(items)` — аналог `Promise.all`:\n\n- принимает массив промисов **и обычных значений**;\n- возвращает промис с массивом результатов **в исходном порядке** (не в порядке завершения);\n- отклоняется с первой ошибкой;\n- для пустого массива сразу разрешается `[]`.\n\nИспользовать `Promise.all`, `allSettled`, `any`, `race` нельзя.",starter:`function promiseAll(items) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) {
      resolve(results);
      return;
    }
    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value;
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }, reject);
    });
  });
}
`,tests:[{name:`сохраняет порядок результатов`,code:`const slow = new Promise((r) => setTimeout(() => r('\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E'), 30));
const fast = new Promise((r) => setTimeout(() => r('\u0431\u044B\u0441\u0442\u0440\u043E'), 5));
expect(await promiseAll([slow, fast])).toEqual(['\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E', '\u0431\u044B\u0441\u0442\u0440\u043E']);`},{name:`принимает обычные значения`,code:`expect(await promiseAll([1, Promise.resolve(2), 3])).toEqual([1, 2, 3]);`},{name:`пустой массив разрешается сразу`,code:`expect(await promiseAll([])).toEqual([]);`},{name:`отклоняется с первой ошибкой`,code:`let message = '';
try {
  await promiseAll([Promise.resolve(1), Promise.reject(new Error('\u0441\u0431\u043E\u0439')), new Promise(() => {})]);
} catch (e) {
  message = e.message;
}
expect(message).toBe('\u0441\u0431\u043E\u0439');`},{name:`не использует встроенный Promise.all`,code:`const original = Promise.all;
Promise.all = () => { throw new Error('Promise.all \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D'); };
try {
  expect(await promiseAll([1, 2])).toEqual([1, 2]);
} finally {
  Promise.all = original;
}`}],hints:[`Создайте массив результатов нужной длины и счётчик оставшихся промисов.`,`Promise.resolve(item) превращает обычное значение в промис.`,`Записывайте результат по индексу: results[index] = value.`]},{id:`js-memoize`,trackId:`javascript`,title:`Мемоизация функции`,level:`basic`,language:`javascript`,relatedLessonId:`closures`,description:"Напишите `memoize(fn)`, которая кеширует результаты `fn` по аргументам.\n\n- Повторный вызов с теми же аргументами не должен вызывать `fn`.\n- Аргументы — примитивы (числа, строки), их может быть несколько.\n- У возвращённой функции должен быть метод `clear()`, очищающий кеш.",starter:`function memoize(fn) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function memoize(fn) {
  const cache = new Map();
  const memoized = function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
  memoized.clear = () => cache.clear();
  return memoized;
}
`,tests:[{name:`кеширует результат`,code:`const square = spy((n) => n * n);
const fast = memoize(square);
expect(fast(4)).toBe(16);
expect(fast(4)).toBe(16);
expect(square.calls).toHaveLength(1);`},{name:`различает разные наборы аргументов`,code:`const add = spy((a, b) => a + b);
const fast = memoize(add);
fast(1, 2); fast(2, 1); fast(1, 2);
expect(add.calls).toHaveLength(2);`},{name:`clear() очищает кеш`,code:`const id = spy((x) => x);
const fast = memoize(id);
fast('a');
fast.clear();
fast('a');
expect(id.calls).toHaveLength(2);`}],hints:[`Map в замыкании — удобное хранилище кеша.`,`Ключ для нескольких аргументов можно получить через JSON.stringify(args).`]},{id:`js-deep-equal`,trackId:`javascript`,title:`Глубокое сравнение`,level:`middle`,language:`javascript`,relatedLessonId:`types-and-coercion`,description:"Напишите `deepEqual(a, b)`, которая сравнивает значения структурно:\n\n- примитивы — как `Object.is` (значит, `NaN` равен `NaN`);\n- массивы — по длине и элементам;\n- обычные объекты — по набору собственных ключей и значениям (порядок ключей не важен);\n- `Date` — по времени.",starter:`function deepEqual(a, b) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}
`,tests:[{name:`примитивы и NaN`,code:`expect(deepEqual(1, 1)).toBe(true);
expect(deepEqual('a', 'b')).toBe(false);
expect(deepEqual(NaN, NaN)).toBe(true);
expect(deepEqual(0, '0')).toBe(false);`},{name:`вложенные объекты и массивы`,code:`expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(false);`},{name:`порядок ключей не важен`,code:`expect(deepEqual({ x: 1, y: 2 }, { y: 2, x: 1 })).toBe(true);`},{name:`разное количество ключей`,code:`expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);`},{name:`массив не равен объекту`,code:`expect(deepEqual([1], { 0: 1 })).toBe(false);`},{name:`даты сравниваются по времени`,code:`expect(deepEqual(new Date(5), new Date(5))).toBe(true);
expect(deepEqual(new Date(5), new Date(6))).toBe(false);`}],hints:[`Начните с Object.is для примитивов.`,`Для объектов сравните количество ключей, затем рекурсивно — значения.`,`Не забудьте отличить массив от объекта через Array.isArray.`]},{id:`js-deep-clone`,trackId:`javascript`,title:`Глубокое копирование`,level:`middle`,language:`javascript`,relatedLessonId:`immutability`,description:"Реализуйте `deepClone(value)` без `structuredClone` и JSON:\n\n- копирует объекты, массивы, `Date`, `Map`, `Set` на любую глубину;\n- поддерживает **циклические ссылки** (копия должна ссылаться сама на себя так же, как оригинал);\n- примитивы возвращает как есть.",starter:`function deepClone(value) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function deepClone(value, seen = new Map()) {
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    value.forEach((v, k) => copy.set(deepClone(k, seen), deepClone(v, seen)));
    return copy;
  }
  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((v) => copy.add(deepClone(v, seen)));
    return copy;
  }
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    copy[key] = deepClone(value[key], seen);
  }
  return copy;
}
`,tests:[{name:`вложенные объекты копируются`,code:`const original = { a: { b: [1, 2] } };
const copy = deepClone(original);
copy.a.b.push(3);
expect(original.a.b).toEqual([1, 2]);
expect(copy).not.toBe(original);`},{name:`Date, Map и Set`,code:`const original = { d: new Date(10), m: new Map([['k', { v: 1 }]]), s: new Set([1, 2]) };
const copy = deepClone(original);
expect(copy.d).toBeInstanceOf(Date);
expect(copy.d.getTime()).toBe(10);
expect(copy.d).not.toBe(original.d);
expect(copy.m.get('k')).toEqual({ v: 1 });
expect(copy.m.get('k')).not.toBe(original.m.get('k'));
expect(copy.s.has(2)).toBe(true);`},{name:`циклические ссылки`,code:`const node = { name: 'root' };
node.self = node;
const copy = deepClone(node);
expect(copy.self).toBe(copy);
expect(copy).not.toBe(node);`},{name:`примитивы возвращаются как есть`,code:`expect(deepClone(5)).toBe(5);
expect(deepClone(null)).toBe(null);
expect(deepClone('x')).toBe('x');`}],hints:[`Для циклов нужна карта «оригинал → копия» (Map), передаваемая в рекурсию.`,`Запишите копию в карту до обхода её содержимого.`]},{id:`js-curry`,trackId:`javascript`,title:`Каррирование`,level:`middle`,language:`javascript`,relatedLessonId:`closures`,description:`\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \`curry(fn)\`. \u041A\u0430\u0440\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0444\u0443\u043D\u043A\u0446\u0438\u044F \u043D\u0430\u043A\u0430\u043F\u043B\u0438\u0432\u0430\u0435\u0442 \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u044B, \u043F\u043E\u043A\u0430 \u0438\u0445 \u043D\u0435 \u0441\u0442\u0430\u043D\u0435\u0442 \u043D\u0435 \u043C\u0435\u043D\u044C\u0448\u0435 \`fn.length\`, \u0438 \u0442\u043E\u0433\u0434\u0430 \u0432\u044B\u0437\u044B\u0432\u0430\u0435\u0442 \`fn\`.

~~~js
const sum3 = curry((a, b, c) => a + b + c);
sum3(1)(2)(3); // 6
sum3(1, 2)(3); // 6
sum3(1)(2, 3); // 6
~~~`,starter:`function curry(fn) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}
`,tests:[{name:`по одному аргументу`,code:`const sum3 = curry((a, b, c) => a + b + c);
expect(sum3(1)(2)(3)).toBe(6);`},{name:`группами аргументов`,code:`const sum3 = curry((a, b, c) => a + b + c);
expect(sum3(1, 2)(3)).toBe(6);
expect(sum3(1)(2, 3)).toBe(6);
expect(sum3(1, 2, 3)).toBe(6);`},{name:`частичное применение переиспользуется`,code:`const greet = curry((greeting, name) => greeting + ', ' + name);
const hello = greet('\u041F\u0440\u0438\u0432\u0435\u0442');
expect(hello('\u0410\u043D\u043D\u0430')).toBe('\u041F\u0440\u0438\u0432\u0435\u0442, \u0410\u043D\u043D\u0430');
expect(hello('\u041E\u043B\u0435\u0433')).toBe('\u041F\u0440\u0438\u0432\u0435\u0442, \u041E\u043B\u0435\u0433');`}],hints:[`fn.length — количество объявленных параметров функции.`,`Если аргументов недостаточно, верните функцию, которая склеит старые и новые аргументы.`]},{id:`js-bind`,trackId:`javascript`,title:`Полифил bind`,level:`middle`,language:`javascript`,relatedLessonId:`this-binding`,description:"Добавьте в `Function.prototype` метод `myBind(context, ...args)`, работающий как стандартный `bind`:\n\n- возвращает новую функцию с жёстко привязанным `this`;\n- поддерживает частичное применение аргументов;\n- нельзя использовать встроенный `bind`.",starter:`Function.prototype.myBind = function (context, ...boundArgs) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
};
`,solution:`Function.prototype.myBind = function (context, ...boundArgs) {
  const fn = this;
  return function (...args) {
    return fn.apply(context, [...boundArgs, ...args]);
  };
};
`,tests:[{name:`привязывает this`,code:`const user = { name: '\u0410\u043D\u043D\u0430' };
function getName() { return this.name; }
expect(getName.myBind(user)()).toBe('\u0410\u043D\u043D\u0430');`},{name:`частичное применение`,code:`function sum(a, b, c) { return a + b + c; }
const add10 = sum.myBind(null, 10);
expect(add10(1, 2)).toBe(13);`},{name:`контекст не теряется при передаче как колбэк`,code:`const counter = { count: 0, inc() { this.count += 1; } };
const inc = counter.inc.myBind(counter);
[1, 2, 3].forEach(() => inc());
expect(counter.count).toBe(3);`},{name:`не использует встроенный bind`,code:`const original = Function.prototype.bind;
Function.prototype.bind = function () { throw new Error('bind \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D'); };
try {
  function f() { return this.x; }
  expect(f.myBind({ x: 1 })()).toBe(1);
} finally {
  Function.prototype.bind = original;
}`}],hints:[`Внутри myBind this — это функция, у которой вызвали метод.`,`Используйте fn.apply(context, args).`]},{id:`js-event-emitter`,trackId:`javascript`,title:`EventEmitter`,level:`basic`,language:`javascript`,relatedLessonId:`dom-events`,description:"Реализуйте класс `EventEmitter` с методами:\n\n- `on(event, handler)` — подписка, возвращает функцию отписки;\n- `off(event, handler)` — отписка;\n- `once(event, handler)` — обработчик сработает один раз;\n- `emit(event, ...args)` — вызвать обработчики события в порядке подписки, вернуть `true`, если обработчики были.",starter:`class EventEmitter {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`class EventEmitter {
  #handlers = new Map();

  on(event, handler) {
    const list = this.#handlers.get(event) ?? [];
    list.push(handler);
    this.#handlers.set(event, list);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const list = this.#handlers.get(event);
    if (!list) return;
    this.#handlers.set(event, list.filter((h) => h !== handler && h.original !== handler));
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    wrapper.original = handler;
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const list = this.#handlers.get(event);
    if (!list || list.length === 0) return false;
    [...list].forEach((handler) => handler(...args));
    return true;
  }
}
`,tests:[{name:`on и emit`,code:`const bus = new EventEmitter();
const handler = spy();
bus.on('save', handler);
expect(bus.emit('save', 1, 2)).toBe(true);
expect(handler.calls).toEqual([[1, 2]]);`},{name:`emit без подписчиков возвращает false`,code:`expect(new EventEmitter().emit('nothing')).toBe(false);`},{name:`отписка через возвращённую функцию и off`,code:`const bus = new EventEmitter();
const a = spy();
const b = spy();
const unsubscribe = bus.on('x', a);
bus.on('x', b);
unsubscribe();
bus.off('x', b);
bus.emit('x');
expect(a.calls).toHaveLength(0);
expect(b.calls).toHaveLength(0);`},{name:`once срабатывает один раз`,code:`const bus = new EventEmitter();
const handler = spy();
bus.once('ready', handler);
bus.emit('ready', 'a');
bus.emit('ready', 'b');
expect(handler.calls).toEqual([['a']]);`},{name:`порядок вызова — порядок подписки`,code:`const bus = new EventEmitter();
const order = [];
bus.on('e', () => order.push(1));
bus.on('e', () => order.push(2));
bus.emit('e');
expect(order).toEqual([1, 2]);`}],hints:[`Храните Map: имя события → массив обработчиков.`,`once можно реализовать обёрткой, которая отписывает себя перед вызовом.`]},{id:`js-flatten`,trackId:`javascript`,title:`Flatten с глубиной`,level:`basic`,language:`javascript`,relatedLessonId:`modern-features`,description:`\u0420\u0435\u0430\u043B\u0438\u0437\u0443\u0439\u0442\u0435 \`flatten(array, depth = 1)\` \u2014 \u0430\u043D\u0430\u043B\u043E\u0433 \`Array.prototype.flat\` \u0431\u0435\u0437 \u0435\u0433\u043E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F.

~~~js
flatten([1, [2, [3, [4]]]]); // [1, 2, [3, [4]]]
flatten([1, [2, [3, [4]]]], Infinity); // [1, 2, 3, 4]
~~~`,starter:`function flatten(array, depth = 1) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function flatten(array, depth = 1) {
  const result = [];
  for (const item of array) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}
`,tests:[{name:`глубина по умолчанию 1`,code:`expect(flatten([1, [2, [3, [4]]]])).toEqual([1, 2, [3, [4]]]);`},{name:`произвольная глубина`,code:`expect(flatten([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);`},{name:`Infinity — полностью`,code:`expect(flatten([[[[1]]], 2], Infinity)).toEqual([1, 2]);`},{name:`не использует Array.prototype.flat`,code:`const original = Array.prototype.flat;
Array.prototype.flat = function () { throw new Error('flat \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D'); };
try {
  expect(flatten([1, [2]])).toEqual([1, 2]);
} finally {
  Array.prototype.flat = original;
}`}],hints:[`Рекурсия с уменьшением depth на каждом уровне.`]},{id:`js-get-path`,trackId:`javascript`,title:`Безопасный доступ по пути`,level:`basic`,language:`javascript`,relatedLessonId:`modern-features`,description:"Напишите `get(object, path, defaultValue)`. Путь — строка вида `'user.addresses[0].city'`.\n\n- Если на каком-то шаге значение `null` или `undefined` — вернуть `defaultValue`.\n- Если итоговое значение `undefined` — вернуть `defaultValue`.",starter:`function get(object, path, defaultValue) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`function get(object, path, defaultValue) {
  const keys = path.replace(/\\[(\\w+)\\]/g, '.$1').split('.').filter(Boolean);
  let current = object;
  for (const key of keys) {
    if (current == null) return defaultValue;
    current = current[key];
  }
  return current === undefined ? defaultValue : current;
}
`,tests:[{name:`точки и индексы`,code:`const data = { user: { addresses: [{ city: '\u041A\u0430\u0437\u0430\u043D\u044C' }] } };
expect(get(data, 'user.addresses[0].city')).toBe('\u041A\u0430\u0437\u0430\u043D\u044C');`},{name:`значение по умолчанию`,code:`expect(get({ a: null }, 'a.b.c', '\u043D\u0435\u0442')).toBe('\u043D\u0435\u0442');
expect(get({}, 'x', 0)).toBe(0);`},{name:`falsy-значения не заменяются`,code:`expect(get({ a: { b: 0 } }, 'a.b', 5)).toBe(0);
expect(get({ a: '' }, 'a', 'x')).toBe('');`}],hints:[`Превратите [0] в .0 регулярным выражением, затем split('.').`,`Проверяйте current == null на каждом шаге.`]},{id:`js-retry`,trackId:`javascript`,title:`Повтор асинхронной операции`,level:`middle`,language:`javascript`,relatedLessonId:`promises`,description:"Напишите `retry(fn, { attempts, delayMs })`:\n\n- вызывает асинхронную `fn()`;\n- при ошибке ждёт `delayMs` и пробует снова, всего не более `attempts` попыток;\n- возвращает первый успешный результат или отклоняется **последней** ошибкой.",starter:`async function retry(fn, { attempts, delayMs }) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`async function retry(fn, { attempts, delayMs }) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
`,tests:[{name:`возвращает результат после неудачных попыток`,code:`let calls = 0;
const flaky = async () => {
  calls += 1;
  if (calls < 3) throw new Error('\u0441\u0431\u043E\u0439 ' + calls);
  return 'ok';
};
expect(await retry(flaky, { attempts: 5, delayMs: 5 })).toBe('ok');
expect(calls).toBe(3);`},{name:`отклоняется последней ошибкой`,code:`let calls = 0;
let message = '';
try {
  await retry(async () => { calls += 1; throw new Error('\u043F\u043E\u043F\u044B\u0442\u043A\u0430 ' + calls); }, { attempts: 3, delayMs: 1 });
} catch (e) {
  message = e.message;
}
expect(message).toBe('\u043F\u043E\u043F\u044B\u0442\u043A\u0430 3');
expect(calls).toBe(3);`},{name:`ждёт между попытками`,code:`let calls = 0;
const started = Date.now();
await retry(async () => { calls += 1; if (calls < 3) throw new Error('x'); return 1; }, { attempts: 3, delayMs: 30 });
expect(Date.now() - started).toBeGreaterThan(50);`}],hints:[`Цикл for с try/catch и await внутри.`,`Задержка — await new Promise((r) => setTimeout(r, ms)).`]},{id:`js-promise-pool`,trackId:`javascript`,title:`Ограничение параллельности`,level:`advanced`,language:`javascript`,relatedLessonId:`promises`,description:"Напишите `runWithLimit(tasks, limit)`. `tasks` — массив функций, возвращающих промисы.\n\n- Одновременно выполняется не больше `limit` задач.\n- Как только задача завершилась, запускается следующая.\n- Результат — массив значений в **исходном порядке** задач.",starter:`async function runWithLimit(tasks, limit) {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
}
`,solution:`async function runWithLimit(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
`,tests:[{name:`сохраняет порядок`,code:`const tasks = [30, 5, 15].map((ms, i) => () => new Promise((r) => setTimeout(() => r(i), ms)));
expect(await runWithLimit(tasks, 2)).toEqual([0, 1, 2]);`},{name:`не превышает лимит`,code:`let active = 0;
let maxActive = 0;
const task = () => new Promise((resolve) => {
  active += 1;
  maxActive = Math.max(maxActive, active);
  setTimeout(() => { active -= 1; resolve(true); }, 10);
});
await runWithLimit(Array.from({ length: 7 }, () => task), 3);
expect(maxActive).toBe(3);`},{name:`пустой список`,code:`expect(await runWithLimit([], 3)).toEqual([]);`}],hints:[`Запустите limit «воркеров», каждый берёт следующую задачу из общего счётчика.`,`Индекс задачи нужно запомнить до await, чтобы записать результат в правильную позицию.`]},{id:`js-range-iterator`,trackId:`javascript`,title:`Итерируемый диапазон`,level:`basic`,language:`javascript`,relatedLessonId:`generators-iterators`,description:`\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043A\u043B\u0430\u0441\u0441 \`Range(from, to, step = 1)\`, \u043E\u0431\u044A\u0435\u043A\u0442\u044B \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0431\u0438\u0440\u0430\u0442\u044C \u0447\u0435\u0440\u0435\u0437 \`for...of\` \u0438 spread.

~~~js
[...new Range(1, 5)]; // [1, 2, 3, 4, 5]
[...new Range(0, 10, 5)]; // [0, 5, 10]
~~~

\u041F\u0435\u0440\u0435\u0431\u043E\u0440 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437.`,starter:`class Range {
  constructor(from, to, step = 1) {
    // \u0432\u0430\u0448 \u043A\u043E\u0434
  }
}
`,solution:`class Range {
  constructor(from, to, step = 1) {
    this.from = from;
    this.to = to;
    this.step = step;
  }

  *[Symbol.iterator]() {
    for (let value = this.from; value <= this.to; value += this.step) {
      yield value;
    }
  }
}
`,tests:[{name:`spread`,code:`expect([...new Range(1, 5)]).toEqual([1, 2, 3, 4, 5]);`},{name:`шаг`,code:`expect([...new Range(0, 10, 5)]).toEqual([0, 5, 10]);`},{name:`повторный перебор`,code:`const range = new Range(1, 3);
expect([...range]).toEqual([1, 2, 3]);
expect([...range]).toEqual([1, 2, 3]);`},{name:`for...of`,code:`let sum = 0;
for (const n of new Range(1, 4)) sum += n;
expect(sum).toBe(10);`}],hints:[`Определите метод *[Symbol.iterator]() — генератор.`]}];var u$1=[{id:`rx-custom-operator`,trackId:`rxjs`,title:`Свой оператор с нуля`,level:`middle`,language:`typescript`,relatedLessonId:`observable-basics`,description:"Реализуйте pipeable-оператор `mapWithIndex(fn)` **без** использования операторов RxJS — только через `new Observable`:\n\n~~~ts\nof('a', 'b').pipe(mapWithIndex((value, index) => value + index)); // 'a0', 'b1'\n~~~\n\nТребования:\n\n- пробрасывать `error` и `complete`;\n- при отписке от результата отписываться от источника;\n- исключение в `fn` превращать в `error` потока.\n\nВ песочнице RxJS доступен как объект `rxjs`.",starter:`const { Observable } = rxjs;

function mapWithIndex<T, R>(fn: (value: T, index: number) => R) {
  return (source: rxjs.Observable<T>) => source;
}
`,solution:`const { Observable } = rxjs;

function mapWithIndex<T, R>(fn: (value: T, index: number) => R) {
  return (source: rxjs.Observable<T>) =>
    new Observable<R>((subscriber) => {
      let index = 0;
      const subscription = source.subscribe({
        next(value) {
          let result: R;
          try {
            result = fn(value, index++);
          } catch (error) {
            subscriber.error(error);
            return;
          }
          subscriber.next(result);
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
      return () => subscription.unsubscribe();
    });
}
`,tests:[{name:`преобразует значения с индексом`,code:`const { of } = rxjs;
expect(await collect(of('a', 'b', 'c').pipe(mapWithIndex((v, i) => v + i)))).toEqual(['a0', 'b1', 'c2']);`},{name:`реализован без встроенных операторов`,code:`const { of } = rxjs;
const source = String(mapWithIndex);
expect(source.includes('pipe(')).toBe(false);
expect(await collect(of(1).pipe(mapWithIndex((v) => v * 2)))).toEqual([2]);`},{name:`пробрасывает ошибку источника`,code:`const { throwError } = rxjs;
let message = '';
try { await collect(throwError(() => new Error('\u0441\u0431\u043E\u0439')).pipe(mapWithIndex((v) => v))); } catch (e) { message = e.message; }
expect(message).toBe('\u0441\u0431\u043E\u0439');`},{name:`исключение в fn становится error`,code:`const { of } = rxjs;
let message = '';
try { await collect(of(1).pipe(mapWithIndex(() => { throw new Error('\u043F\u043B\u043E\u0445\u043E\u0439 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0440'); }))); } catch (e) { message = e.message; }
expect(message).toBe('\u043F\u043B\u043E\u0445\u043E\u0439 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0440');`},{name:`отписка доходит до источника`,code:`const { interval } = rxjs;
let ticks = 0;
const sub = interval(5).pipe(mapWithIndex(() => ticks++)).subscribe();
await sleep(30);
sub.unsubscribe();
const after = ticks;
await sleep(30);
expect(ticks).toBe(after);`}],hints:[`Оператор — функция, принимающая source и возвращающая new Observable.`,`Верните из функции подписки teardown: () => subscription.unsubscribe().`]},{id:`rx-typeahead`,trackId:`rxjs`,title:`Поиск с автокомплитом`,level:`middle`,language:`typescript`,relatedLessonId:`operator-decision-tree`,description:"Напишите `createSearch(input$, search, debounceMs)`. `input$` — поток введённых строк, `search(query)` — функция, возвращающая Observable результатов.\n\nТребования:\n\n- обрезать пробелы, игнорировать запросы короче 2 символов;\n- ждать паузу `debounceMs` после ввода;\n- не искать повторно ту же строку;\n- **отменять** предыдущий запрос, если пришёл новый;\n- ошибка поиска не должна ломать поток — вместо результатов отдавать `[]`.",starter:`const { debounceTime, distinctUntilChanged, filter, map, switchMap, catchError, of } = rxjs;

function createSearch(
  input$: rxjs.Observable<string>,
  search: (query: string) => rxjs.Observable<string[]>,
  debounceMs: number,
): rxjs.Observable<string[]> {
  return of([]);
}
`,solution:`const { debounceTime, distinctUntilChanged, filter, map, switchMap, catchError, of } = rxjs;

function createSearch(
  input$: rxjs.Observable<string>,
  search: (query: string) => rxjs.Observable<string[]>,
  debounceMs: number,
): rxjs.Observable<string[]> {
  return input$.pipe(
    map((query) => query.trim()),
    debounceTime(debounceMs),
    distinctUntilChanged(),
    filter((query) => query.length >= 2),
    switchMap((query) => search(query).pipe(catchError(() => of([])))),
  );
}
`,tests:[{name:`debounce: ищет только последнюю строку серии`,code:`const { Subject, of } = rxjs;
const input = new Subject();
const calls = spy((q) => of([q]));
const results = [];
createSearch(input, calls, 20).subscribe((r) => results.push(r));
input.next('an'); input.next('ang'); input.next('angu');
await sleep(50);
expect(calls.calls).toEqual([['angu']]);
expect(results).toEqual([['angu']]);`},{name:`короткие и повторные запросы игнорируются`,code:`const { Subject, of } = rxjs;
const input = new Subject();
const calls = spy((q) => of([q]));
createSearch(input, calls, 10).subscribe();
input.next('a'); await sleep(25);
input.next(' rx '); await sleep(25);
input.next('rx'); await sleep(25);
expect(calls.calls).toEqual([['rx']]);`},{name:`отменяет предыдущий запрос`,code:`const { Subject, timer, map } = rxjs;
const input = new Subject();
const results = [];
const slowSearch = (q) => timer(q === 'first' ? 60 : 5).pipe(map(() => [q]));
createSearch(input, slowSearch, 5).subscribe((r) => results.push(r));
input.next('first');
await sleep(20);
input.next('second');
await sleep(100);
expect(results).toEqual([['second']]);`},{name:`ошибка поиска не ломает поток`,code:`const { Subject, throwError, of } = rxjs;
const input = new Subject();
const results = [];
const flaky = (q) => (q === 'bad' ? throwError(() => new Error('500')) : of([q]));
createSearch(input, flaky, 5).subscribe((r) => results.push(r));
input.next('bad'); await sleep(20);
input.next('good'); await sleep(20);
expect(results).toEqual([[], ['good']]);`}],hints:[`Порядок: map(trim) → debounceTime → distinctUntilChanged → filter → switchMap.`,`catchError ставьте внутри switchMap — на поток конкретного запроса.`]},{id:`rx-retry-backoff`,trackId:`rxjs`,title:`Повтор с экспоненциальной задержкой`,level:`middle`,language:`typescript`,relatedLessonId:`error-handling`,description:"Напишите оператор `retryWithBackoff({ maxRetries, baseMs, shouldRetry })`:\n\n- при ошибке повторяет подписку на источник не более `maxRetries` раз;\n- задержка перед попыткой N (с единицы) — `baseMs * 2^(N-1)`;\n- если `shouldRetry(error)` вернул `false` — ошибка пробрасывается сразу, без повторов.",starter:`const { retry, timer, throwError } = rxjs;

function retryWithBackoff<T>(options: {
  maxRetries: number;
  baseMs: number;
  shouldRetry?: (error: unknown) => boolean;
}) {
  return (source: rxjs.Observable<T>) => source;
}
`,solution:`const { retry, timer, throwError } = rxjs;

function retryWithBackoff<T>(options: {
  maxRetries: number;
  baseMs: number;
  shouldRetry?: (error: unknown) => boolean;
}) {
  const { maxRetries, baseMs, shouldRetry = () => true } = options;
  return (source: rxjs.Observable<T>) =>
    source.pipe(
      retry({
        count: maxRetries,
        delay: (error, attempt) =>
          shouldRetry(error) ? timer(baseMs * 2 ** (attempt - 1)) : throwError(() => error),
      }),
    );
}
`,tests:[{name:`успех после нескольких ошибок`,code:`const { defer, of, throwError } = rxjs;
let attempts = 0;
const source = defer(() => (++attempts < 3 ? throwError(() => new Error('\u0441\u0431\u043E\u0439')) : of('ok')));
expect(await collect(source.pipe(retryWithBackoff({ maxRetries: 5, baseMs: 5 })))).toEqual(['ok']);
expect(attempts).toBe(3);`},{name:`ограничение числа повторов`,code:`const { defer, throwError } = rxjs;
let attempts = 0;
const source = defer(() => { attempts++; return throwError(() => new Error('\u0432\u0441\u0435\u0433\u0434\u0430')); });
let message = '';
try { await collect(source.pipe(retryWithBackoff({ maxRetries: 2, baseMs: 1 }))); } catch (e) { message = e.message; }
expect(message).toBe('\u0432\u0441\u0435\u0433\u0434\u0430');
expect(attempts).toBe(3);`},{name:`задержка растёт экспоненциально`,code:`const { defer, throwError } = rxjs;
const times = [];
const source = defer(() => { times.push(Date.now()); return throwError(() => new Error('x')); });
try { await collect(source.pipe(retryWithBackoff({ maxRetries: 3, baseMs: 20 }))); } catch {}
const gaps = times.slice(1).map((t, i) => t - times[i]);
expect(gaps[0]).toBeGreaterThan(14);
expect(gaps[1]).toBeGreaterThan(34);
expect(gaps[2]).toBeGreaterThan(74);`},{name:`shouldRetry останавливает повторы`,code:`const { defer, throwError } = rxjs;
let attempts = 0;
const source = defer(() => { attempts++; return throwError(() => ({ status: 404 })); });
try { await collect(source.pipe(retryWithBackoff({ maxRetries: 5, baseMs: 1, shouldRetry: (e) => e.status >= 500 }))); } catch {}
expect(attempts).toBe(1);`}],hints:[`retry({ count, delay }) — delay получает ошибку и номер попытки (с 1).`,`Чтобы прекратить повторы, верните из delay throwError(() => error).`]},{id:`rx-exhaust-submit`,trackId:`rxjs`,title:`Отправка формы без дублей`,level:`basic`,language:`typescript`,relatedLessonId:`higher-order`,description:"Пользователь нервно жмёт «Оплатить». Напишите `submitFlow(clicks$, send)`: пока запрос `send()` выполняется, новые клики игнорируются. Результат — поток ответов сервера.\n\nПодумайте, почему здесь не подходят `switchMap` (отменит оплату на клиенте, но не на сервере) и `mergeMap` (создаст несколько оплат).",starter:`const { exhaustMap, switchMap, mergeMap, concatMap } = rxjs;

function submitFlow<T>(clicks$: rxjs.Observable<unknown>, send: () => rxjs.Observable<T>): rxjs.Observable<T> {
  return clicks$.pipe(mergeMap(() => send()));
}
`,solution:`const { exhaustMap, switchMap, mergeMap, concatMap } = rxjs;

function submitFlow<T>(clicks$: rxjs.Observable<unknown>, send: () => rxjs.Observable<T>): rxjs.Observable<T> {
  return clicks$.pipe(exhaustMap(() => send()));
}
`,tests:[{name:`клики во время запроса игнорируются`,code:`const { Subject, timer, map } = rxjs;
const clicks = new Subject();
let requests = 0;
const results = [];
submitFlow(clicks, () => { requests++; return timer(30).pipe(map(() => '\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ' + requests)); }).subscribe((r) => results.push(r));
clicks.next(); clicks.next(); clicks.next();
await sleep(50);
expect(requests).toBe(1);
expect(results).toEqual(['\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E 1']);`},{name:`после завершения можно отправить снова`,code:`const { Subject, timer, map } = rxjs;
const clicks = new Subject();
let requests = 0;
submitFlow(clicks, () => { requests++; return timer(10).pipe(map(() => 'ok')); }).subscribe();
clicks.next();
await sleep(30);
clicks.next();
await sleep(30);
expect(requests).toBe(2);`}],hints:[`Нужен оператор высшего порядка, который «занят» до завершения внутреннего потока.`]},{id:`rx-share-cache`,trackId:`rxjs`,title:`Один запрос на всех подписчиков`,level:`middle`,language:`typescript`,relatedLessonId:`multicasting`,description:`\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0441\u0442\u0440\u0430\u043D \u0433\u0440\u0443\u0437\u0438\u0442\u0441\u044F \u043F\u043E HTTP, \u0430 \u0447\u0438\u0442\u0430\u044E\u0442 \u0435\u0433\u043E \u0434\u0435\u0441\u044F\u0442\u044C \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432. \u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \`cached(request$)\`, \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E\u0449\u0443\u044E \u043F\u043E\u0442\u043E\u043A, \u043A\u043E\u0442\u043E\u0440\u044B\u0439:

- \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0437\u0430\u043F\u0440\u043E\u0441 **\u043E\u0434\u0438\u043D \u0440\u0430\u0437** \u043F\u0440\u0438 \u043F\u0435\u0440\u0432\u043E\u0439 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0435;
- \u043E\u0442\u0434\u0430\u0451\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u0441\u0435\u043C \u0442\u0435\u043A\u0443\u0449\u0438\u043C \u0438 **\u0431\u0443\u0434\u0443\u0449\u0438\u043C** \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0430\u043C \u0431\u0435\u0437 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430;
- \u0435\u0441\u043B\u0438 \u0437\u0430\u043F\u0440\u043E\u0441 \u0443\u043F\u0430\u043B \u2014 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442 \u0437\u0430\u043F\u0440\u043E\u0441 (\u043E\u0448\u0438\u0431\u043A\u0430 \u043D\u0435 \u043A\u0435\u0448\u0438\u0440\u0443\u0435\u0442\u0441\u044F).`,starter:`const { shareReplay, share } = rxjs;

function cached<T>(request$: rxjs.Observable<T>): rxjs.Observable<T> {
  return request$;
}
`,solution:`const { shareReplay, share } = rxjs;

function cached<T>(request$: rxjs.Observable<T>): rxjs.Observable<T> {
  return request$.pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
`,tests:[{name:`один запрос на несколько подписчиков`,code:`const { defer, timer, map } = rxjs;
let requests = 0;
const countries$ = cached(defer(() => { requests++; return timer(10).pipe(map(() => ['RU', 'KZ'])); }));
const [a, b] = await Promise.all([collect(countries$), collect(countries$)]);
expect(a).toEqual([['RU', 'KZ']]);
expect(b).toEqual([['RU', 'KZ']]);
expect(requests).toBe(1);`},{name:`поздний подписчик получает кеш`,code:`const { defer, of } = rxjs;
let requests = 0;
const data$ = cached(defer(() => { requests++; return of('\u0434\u0430\u043D\u043D\u044B\u0435'); }));
await collect(data$);
await sleep(10);
expect(await collect(data$)).toEqual(['\u0434\u0430\u043D\u043D\u044B\u0435']);
expect(requests).toBe(1);`},{name:`ошибка не кешируется`,code:`const { defer, of, throwError } = rxjs;
let requests = 0;
const data$ = cached(defer(() => (++requests === 1 ? throwError(() => new Error('\u0441\u0431\u043E\u0439')) : of('ok'))));
try { await collect(data$); } catch {}
expect(await collect(data$)).toEqual(['ok']);
expect(requests).toBe(2);`}],hints:[`shareReplay с bufferSize: 1.`,`Для конечного справочника refCount: false — осознанный вечный кеш.`]},{id:`rx-scan-store`,trackId:`rxjs`,title:`Стор на scan`,level:`middle`,language:`typescript`,relatedLessonId:`transformation`,description:"Сделайте мини-стор корзины на RxJS. `createCartStore()` возвращает:\n\n- `dispatch(action)` — отправка действия;\n- `state$` — поток состояния, **сразу** отдающий текущее состояние новому подписчику.\n\nДействия: `{ type: 'add', item: { id, price } }`, `{ type: 'remove', id }`, `{ type: 'clear' }`. Повторное добавление того же `id` увеличивает `qty`.\n\nСостояние: `{ items: Array<{ id, price, qty }>, total }`. Обновления — иммутабельные.",starter:`const { Subject, scan, startWith, shareReplay, map } = rxjs;

type Item = { id: string; price: number; qty: number };
type State = { items: Item[]; total: number };
type Action =
  | { type: 'add'; item: { id: string; price: number } }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

function createCartStore() {
  const actions = new Subject<Action>();
  return {
    dispatch: (action: Action) => actions.next(action),
    state$: actions.pipe(map(() => ({ items: [], total: 0 }))),
  };
}
`,solution:`const { Subject, scan, startWith, shareReplay, map } = rxjs;

type Item = { id: string; price: number; qty: number };
type State = { items: Item[]; total: number };
type Action =
  | { type: 'add'; item: { id: string; price: number } }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

const initial: State = { items: [], total: 0 };

function reducer(state: State, action: Action): State {
  let items: Item[];
  switch (action.type) {
    case 'add': {
      const existing = state.items.find((i) => i.id === action.item.id);
      items = existing
        ? state.items.map((i) => (i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...state.items, { ...action.item, qty: 1 }];
      break;
    }
    case 'remove':
      items = state.items.filter((i) => i.id !== action.id);
      break;
    case 'clear':
      items = [];
      break;
  }
  return { items, total: items.reduce((sum, i) => sum + i.price * i.qty, 0) };
}

function createCartStore() {
  const actions = new Subject<Action>();
  const state$ = actions.pipe(scan(reducer, initial), startWith(initial), shareReplay({ bufferSize: 1, refCount: false }));
  state$.subscribe();
  return { dispatch: (action: Action) => actions.next(action), state$ };
}
`,tests:[{name:`начальное состояние сразу`,code:`const { take } = rxjs;
const store = createCartStore();
expect(await collect(store.state$.pipe(take(1)))).toEqual([{ items: [], total: 0 }]);`},{name:`add, повтор, remove`,code:`const { take } = rxjs;
const store = createCartStore();
store.dispatch({ type: 'add', item: { id: 'book', price: 500 } });
store.dispatch({ type: 'add', item: { id: 'book', price: 500 } });
store.dispatch({ type: 'add', item: { id: 'pen', price: 50 } });
store.dispatch({ type: 'remove', id: 'pen' });
const [state] = await collect(store.state$.pipe(take(1)));
expect(state).toEqual({ items: [{ id: 'book', price: 500, qty: 2 }], total: 1000 });`},{name:`clear и иммутабельность`,code:`const { take } = rxjs;
const store = createCartStore();
store.dispatch({ type: 'add', item: { id: 'a', price: 1 } });
const [before] = await collect(store.state$.pipe(take(1)));
store.dispatch({ type: 'clear' });
const [after] = await collect(store.state$.pipe(take(1)));
expect(after.items).toEqual([]);
expect(before.items).toHaveLength(1);`}],hints:[`scan(reducer, initial) накапливает состояние, startWith(initial) даёт начальное значение.`,`Чтобы поздние подписчики видели текущее состояние, нужен shareReplay и «горячая» подписка.`]},{id:`rx-combine-vm`,trackId:`rxjs`,title:`View model из нескольких потоков`,level:`basic`,language:`typescript`,relatedLessonId:`combination`,description:"Соберите `createViewModel(products$, filter$, loading$)` — поток `{ visible, count, loading }`:\n\n- `visible` — товары, название которых содержит строку фильтра (без учёта регистра);\n- `count` — количество видимых;\n- поток должен выдать значение **сразу**, даже если `filter$` ещё ничего не выдал (фильтр по умолчанию — пустая строка);\n- новое значение — при изменении любого источника.",starter:`const { combineLatest, map, startWith } = rxjs;

type Product = { id: number; title: string };

function createViewModel(
  products$: rxjs.Observable<Product[]>,
  filter$: rxjs.Observable<string>,
  loading$: rxjs.Observable<boolean>,
) {
  return combineLatest([products$, filter$, loading$]);
}
`,solution:`const { combineLatest, map, startWith } = rxjs;

type Product = { id: number; title: string };

function createViewModel(
  products$: rxjs.Observable<Product[]>,
  filter$: rxjs.Observable<string>,
  loading$: rxjs.Observable<boolean>,
) {
  return combineLatest({ products: products$, filter: filter$.pipe(startWith('')), loading: loading$ }).pipe(
    map(({ products, filter, loading }) => {
      const needle = filter.trim().toLowerCase();
      const visible = products.filter((p) => p.title.toLowerCase().includes(needle));
      return { visible, count: visible.length, loading };
    }),
  );
}
`,tests:[{name:`значение без фильтра`,code:`const { of, NEVER, concat, take } = rxjs;
const products = of([{ id: 1, title: 'Angular' }, { id: 2, title: 'RxJS' }]);
const vm = await collect(createViewModel(products, NEVER, of(false)).pipe(take(1)));
expect(vm).toEqual([{ visible: [{ id: 1, title: 'Angular' }, { id: 2, title: 'RxJS' }], count: 2, loading: false }]);`},{name:`фильтрация без учёта регистра`,code:`const { of, BehaviorSubject, take, skip } = rxjs;
const filter = new BehaviorSubject('');
const values = [];
createViewModel(of([{ id: 1, title: 'Angular' }, { id: 2, title: 'RxJS' }]), filter, of(false)).subscribe((v) => values.push(v));
filter.next('RX');
expect(values.at(-1).count).toBe(1);
expect(values.at(-1).visible[0].title).toBe('RxJS');`},{name:`реагирует на loading`,code:`const { of, BehaviorSubject } = rxjs;
const loading = new BehaviorSubject(true);
const values = [];
createViewModel(of([]), of(''), loading).subscribe((v) => values.push(v.loading));
loading.next(false);
expect(values).toEqual([true, false]);`}],hints:[`combineLatest молчит, пока каждый источник не выдал значение — добавьте startWith для фильтра.`]}];var d=[{id:`sec-escape-html`,trackId:`security`,title:`Экранирование HTML`,level:`basic`,language:`typescript`,relatedLessonId:`xss`,description:"Напишите `escapeHtml(text)`, которая делает строку безопасной для вставки в HTML как текст: заменяет `&`, `<`, `>`, `\"` и `'` на сущности `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`.\n\nВажно: `&` нужно заменять первым или за один проход — иначе получится двойное экранирование. Именно это делает интерполяция `{{ }}` в Angular (через `textContent`).",starter:`function escapeHtml(text: string): string {
  return text;
}
`,solution:`const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}
`,tests:[{name:`тег script обезврежен`,code:`expect(escapeHtml('<script>alert(1)<\/script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');`},{name:`кавычки в атрибутах`,code:`expect(escapeHtml('" onerror="x')).toBe('&quot; onerror=&quot;x');
expect(escapeHtml("it's")).toBe('it&#39;s');`},{name:`нет двойного экранирования`,code:`expect(escapeHtml('a & b < c')).toBe('a &amp; b &lt; c');
expect(escapeHtml('&lt;')).toBe('&amp;lt;');`},{name:`обычный текст не меняется`,code:`expect(escapeHtml('Привет, мир')).toBe('Привет, мир');`}],hints:[`\u041E\u0434\u0438\u043D \u043F\u0440\u043E\u0445\u043E\u0434 replace \u0441 \u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u044B\u043C \u0432\u044B\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C [&<>"'] \u0438 \u0442\u0430\u0431\u043B\u0438\u0446\u0435\u0439 \u0437\u0430\u043C\u0435\u043D.`]},{id:`sec-safe-url`,trackId:`security`,title:`Безопасные ссылки`,level:`middle`,language:`typescript`,relatedLessonId:`dom-sanitizer`,description:'Пользователь указывает ссылку на свой сайт в профиле. Напишите `isSafeUrl(url)`:\n\n- разрешены относительные пути (`/path`, `page?x=1`, `#anchor`) и схемы `http:`, `https:`, `mailto:`, `tel:`;\n- запрещены `javascript:`, `data:`, `vbscript:` и любые другие схемы;\n- учтите обходы: регистр (`JaVaScRiPt:`), пробелы и управляющие символы в начале и внутри схемы (`" javascript:"`, `"java\\tscript:"`), протокол-относительные URL `//evil.com` — запрещены.\n\nПодсказка: так же рассуждает санитайзер URL в Angular.',starter:`function isSafeUrl(url: string): boolean {
  return true;
}
`,solution:`const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function isSafeUrl(url: string): boolean {
  // \u0411\u0440\u0430\u0443\u0437\u0435\u0440\u044B \u0438\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u044E\u0442 \u043F\u0440\u043E\u0431\u0435\u043B\u044B \u0438 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0449\u0438\u0435 \u0441\u0438\u043C\u0432\u043E\u043B\u044B \u0432 \u0441\u0445\u0435\u043C\u0435 \u2014 \u0443\u0434\u0430\u043B\u044F\u0435\u043C \u0438\u0445 \u0442\u0430\u043A \u0436\u0435
  const normalized = url.replace(/[\\u0000-\\u0020\\u007f]/g, '').toLowerCase();
  if (normalized.startsWith('//')) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
  if (!scheme) return true; // \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430
  return ALLOWED_SCHEMES.has(scheme[1] + ':');
}
`,tests:[{name:`разрешённые ссылки`,code:`['https://example.com', 'http://a.ru/x?y=1', 'mailto:me@a.ru', 'tel:+79990001122', '/profile', 'page?tab=2', '#top']
  .forEach((url) => expect(isSafeUrl(url)).toBe(true));`},{name:`опасные схемы`,code:`['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:msgbox', 'file:///etc/passwd']
  .forEach((url) => expect(isSafeUrl(url)).toBe(false));`},{name:`обходы регистром и пробелами`,code:`expect(isSafeUrl('JaVaScRiPt:alert(1)')).toBe(false);
expect(isSafeUrl('  javascript:alert(1)')).toBe(false);
expect(isSafeUrl('java\\tscript:alert(1)')).toBe(false);
expect(isSafeUrl('java\\nscript:alert(1)')).toBe(false);`},{name:`протокол-относительный URL`,code:`expect(isSafeUrl('//evil.example/phish')).toBe(false);`}],hints:[`Сначала нормализуйте строку: удалите управляющие символы и пробелы, приведите к нижнему регистру.`,`Схема — это буквы до первого двоеточия; нет схемы — относительный путь.`]},{id:`sec-safe-path`,trackId:`security`,title:`Защита от path traversal`,level:`middle`,language:`typescript`,relatedLessonId:`owasp-frontend`,description:"Сервер (например, MCP-сервер или dev-прокси) отдаёт файлы из папки `root` по пути от пользователя. Напишите `resolveSafe(root, userPath)`:\n\n- склеивает путь и нормализует `.` и `..`;\n- возвращает итоговый путь, если он **внутри** `root`;\n- возвращает `null`, если путь выходит за пределы `root` (`../../etc/passwd`), абсолютный (`/etc/passwd`) или содержит нулевой байт;\n- разделитель — только `/`; обратный слеш `\\` считайте подозрительным и запрещайте.",starter:`function resolveSafe(root: string, userPath: string): string | null {
  return root + '/' + userPath;
}
`,solution:`function resolveSafe(root: string, userPath: string): string | null {
  if (userPath.includes('\\0') || userPath.includes('\\\\') || userPath.startsWith('/')) return null;
  const rootParts = root.split('/').filter(Boolean);
  const parts = [...rootParts];
  for (const segment of userPath.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (parts.length <= rootParts.length) return null;
      parts.pop();
    } else {
      parts.push(segment);
    }
  }
  return '/' + parts.join('/');
}
`,tests:[{name:`обычные пути`,code:`expect(resolveSafe('/srv/files', 'docs/readme.md')).toBe('/srv/files/docs/readme.md');
expect(resolveSafe('/srv/files', './a/../b.txt')).toBe('/srv/files/b.txt');`},{name:`выход за корень`,code:`expect(resolveSafe('/srv/files', '../secret')).toBeNull();
expect(resolveSafe('/srv/files', 'a/../../etc/passwd')).toBeNull();`},{name:`абсолютные пути и обходы`,code:`expect(resolveSafe('/srv/files', '/etc/passwd')).toBeNull();
expect(resolveSafe('/srv/files', '..\\\\..\\\\windows')).toBeNull();
expect(resolveSafe('/srv/files', 'a.txt\\0.png')).toBeNull();`}],hints:[`Идите по сегментам и ведите стек; «..» снимает сегмент, но не ниже корня.`]},{id:`sec-csp-builder`,trackId:`security`,title:`Сборщик Content-Security-Policy`,level:`basic`,language:`typescript`,relatedLessonId:`csp-trusted-types`,description:`\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \`buildCsp(policy, nonce?)\`, \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u044E\u0449\u0443\u044E \u043E\u0431\u044A\u0435\u043A\u0442 \u0432 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430:

~~~ts
buildCsp({ 'default-src': ["'self'"], 'script-src': ["'self'", '{nonce}'], 'object-src': ["'none'"] }, 'abc');
// "default-src 'self'; script-src 'self' 'nonce-abc'; object-src 'none'"
~~~

- \u043F\u043B\u0435\u0439\u0441\u0445\u043E\u043B\u0434\u0435\u0440 \`{nonce}\` \u0437\u0430\u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u043D\u0430 \`'nonce-<\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435>'\`; \u0435\u0441\u043B\u0438 nonce \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D \u2014 \u0432\u044B\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043E\u0448\u0438\u0431\u043A\u0443;
- \u0434\u0438\u0440\u0435\u043A\u0442\u0438\u0432\u044B \u0441 \u043F\u0443\u0441\u0442\u044B\u043C \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u0432\u044B\u0432\u043E\u0434\u044F\u0442\u0441\u044F \u0431\u0435\u0437 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 (\`upgrade-insecure-requests\`);
- \`'unsafe-inline'\` \u0432 \`script-src\` \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D \u2014 \u0432\u044B\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043E\u0448\u0438\u0431\u043A\u0443 \u0441 \u0442\u0435\u043A\u0441\u0442\u043E\u043C \`unsafe-inline\`.`,starter:`type CspPolicy = Record<string, string[]>;

function buildCsp(policy: CspPolicy, nonce?: string): string {
  return '';
}
`,solution:`type CspPolicy = Record<string, string[]>;

function buildCsp(policy: CspPolicy, nonce?: string): string {
  return Object.entries(policy)
    .map(([directive, sources]) => {
      if (directive === 'script-src' && sources.includes("'unsafe-inline'")) {
        throw new Error("script-src \u043D\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C 'unsafe-inline'");
      }
      const values = sources.map((source) => {
        if (source !== '{nonce}') return source;
        if (!nonce) throw new Error('\u0414\u043B\u044F {nonce} \u043D\u0443\u0436\u0435\u043D nonce');
        return "'nonce-" + nonce + "'";
      });
      return [directive, ...values].join(' ');
    })
    .join('; ');
}
`,tests:[{name:`собирает заголовок`,code:`expect(buildCsp({ 'default-src': ["'self'"], 'script-src': ["'self'", '{nonce}'], 'object-src': ["'none'"] }, 'abc'))
  .toBe("default-src 'self'; script-src 'self' 'nonce-abc'; object-src 'none'");`},{name:`директива без значений`,code:`expect(buildCsp({ 'upgrade-insecure-requests': [], 'img-src': ['https:'] })).toBe('upgrade-insecure-requests; img-src https:');`},{name:`запрет unsafe-inline для скриптов`,code:`expect(() => buildCsp({ 'script-src': ["'self'", "'unsafe-inline'"] })).toThrow('unsafe-inline');`},{name:`nonce обязателен для плейсхолдера`,code:`expect(() => buildCsp({ 'script-src': ['{nonce}'] })).toThrow('nonce');`}],hints:[`Object.entries + map + join("; ").`]}];var p=[{id:`build-module-graph`,trackId:`tooling`,title:`Граф модулей: порядок сборки и циклы`,level:`middle`,language:`typescript`,relatedLessonId:`bundlers-basics`,description:"Сборщик получает граф модулей: `{ 'main.ts': ['app.ts', 'config.ts'], 'app.ts': ['utils.ts'], ... }` — для каждого файла список его импортов.\n\nНапишите `buildOrder(graph, entry)`:\n\n- возвращает модули, **достижимые** из `entry`, в порядке, где каждый модуль идёт **после** своих зависимостей (топологическая сортировка; так модули инициализируются);\n- недостижимые модули не включаются (это и есть «tree-shaking» на уровне файлов);\n- при циклической зависимости бросает ошибку с текстом `Цикл: a.ts → b.ts → a.ts`.",starter:`type ModuleGraph = Record<string, string[]>;

function buildOrder(graph: ModuleGraph, entry: string): string[] {
  return Object.keys(graph);
}
`,solution:`type ModuleGraph = Record<string, string[]>;

function buildOrder(graph: ModuleGraph, entry: string): string[] {
  const order: string[] = [];
  const done = new Set<string>();
  const stack: string[] = [];

  const visit = (file: string): void => {
    if (done.has(file)) return;
    const cycleStart = stack.indexOf(file);
    if (cycleStart !== -1) {
      throw new Error('\u0426\u0438\u043A\u043B: ' + [...stack.slice(cycleStart), file].join(' \u2192 '));
    }
    stack.push(file);
    for (const dependency of graph[file] ?? []) visit(dependency);
    stack.pop();
    done.add(file);
    order.push(file);
  };

  visit(entry);
  return order;
}
`,tests:[{name:`зависимости раньше зависящих`,code:`const graph = { 'main.ts': ['app.ts', 'config.ts'], 'app.ts': ['utils.ts'], 'config.ts': ['utils.ts'], 'utils.ts': [] };
const order = buildOrder(graph, 'main.ts');
expect(order).toHaveLength(4);
expect(order.indexOf('utils.ts')).toBeLessThan(order.indexOf('app.ts'));
expect(order.indexOf('app.ts')).toBeLessThan(order.indexOf('main.ts'));
expect(order.at(-1)).toBe('main.ts');`},{name:`недостижимые модули отбрасываются`,code:`const graph = { 'main.ts': ['a.ts'], 'a.ts': [], 'unused.ts': ['a.ts'] };
expect(buildOrder(graph, 'main.ts')).toEqual(['a.ts', 'main.ts']);`},{name:`обнаруживает цикл`,code:`const graph = { 'main.ts': ['a.ts'], 'a.ts': ['b.ts'], 'b.ts': ['a.ts'] };
expect(() => buildOrder(graph, 'main.ts')).toThrow('\u0426\u0438\u043A\u043B: a.ts \u2192 b.ts \u2192 a.ts');`},{name:`общая зависимость один раз`,code:`const graph = { 'm': ['x', 'y'], 'x': ['z'], 'y': ['z'], 'z': [] };
expect(buildOrder(graph, 'm').filter((f) => f === 'z')).toHaveLength(1);`}],hints:[`Обход в глубину: модуль добавляется в результат после всех своих зависимостей.`,`Стек текущего пути позволяет найти цикл и вывести его.`]},{id:`build-nx-affected`,trackId:`tooling`,title:`Nx affected своими руками`,level:`middle`,language:`typescript`,relatedLessonId:`nx`,description:"Граф проектов монорепозитория: `{ shop: ['feature-cart', 'ui'], 'feature-cart': ['data-access', 'ui'], ... }` — от каждого проекта к его зависимостям.\n\nНапишите `affected(graph, changed)`: принимает список изменённых проектов и возвращает **отсортированный** список всех затронутых — изменённых и всех, кто от них зависит прямо или транзитивно. Именно эти проекты нужно пересобрать и протестировать в CI.",starter:`type ProjectGraph = Record<string, string[]>;

function affected(graph: ProjectGraph, changed: string[]): string[] {
  return [...changed].sort();
}
`,solution:`type ProjectGraph = Record<string, string[]>;

function affected(graph: ProjectGraph, changed: string[]): string[] {
  const dependents = new Map<string, string[]>();
  for (const [project, deps] of Object.entries(graph)) {
    for (const dep of deps) {
      dependents.set(dep, [...(dependents.get(dep) ?? []), project]);
    }
  }
  const result = new Set<string>();
  const queue = [...changed];
  while (queue.length > 0) {
    const project = queue.shift()!;
    if (result.has(project)) continue;
    result.add(project);
    queue.push(...(dependents.get(project) ?? []));
  }
  return [...result].sort();
}
`,tests:[{name:`изменение util затрагивает всех потребителей`,code:`const graph = {
  shop: ['feature-cart', 'feature-catalog'],
  admin: ['feature-users'],
  'feature-cart': ['data-access', 'ui'],
  'feature-catalog': ['ui'],
  'feature-users': ['ui'],
  'data-access': ['util'],
  ui: ['util'],
  util: [],
};
expect(affected(graph, ['data-access'])).toEqual(['data-access', 'feature-cart', 'shop']);
expect(affected(graph, ['util'])).toEqual(['admin', 'data-access', 'feature-cart', 'feature-catalog', 'feature-users', 'shop', 'ui', 'util']);`},{name:`изменение приложения затрагивает только его`,code:`expect(affected({ shop: ['ui'], admin: ['ui'], ui: [] }, ['admin'])).toEqual(['admin']);`},{name:`несколько изменений и отсутствие дублей`,code:`const graph = { app: ['a', 'b'], a: [], b: [] };
expect(affected(graph, ['a', 'b'])).toEqual(['a', 'app', 'b']);`}],hints:[`Постройте обратный граф: зависимость → кто от неё зависит.`,`Обход в ширину от изменённых проектов по обратному графу.`]},{id:`build-semver`,trackId:`tooling`,title:`Совместимость версий для shared-зависимостей`,level:`middle`,language:`typescript`,relatedLessonId:`module-federation`,description:"Module Federation решает, можно ли переиспользовать уже загруженную shared-зависимость, проверяя её версию по диапазону `requiredVersion`. Напишите `satisfies(version, range)` для упрощённого semver (только `MAJOR.MINOR.PATCH`, без пререлизов):\n\n- точная версия `'22.1.0'`;\n- `^` — совместимые изменения: `^22.1.0` = `>=22.1.0 <23.0.0`; для нулевой мажорной `^0.4.2` = `>=0.4.2 <0.5.0`;\n- `~` — патчи: `~22.1.0` = `>=22.1.0 <22.2.0`;\n- `>=` — не меньше указанной.",starter:`function satisfies(version: string, range: string): boolean {
  return version === range;
}
`,solution:`type Version = [number, number, number];

const parse = (v: string): Version => {
  const parts = v.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
};

const compare = (a: Version, b: Version): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function satisfies(version: string, range: string): boolean {
  const v = parse(version);
  if (range.startsWith('>=')) return compare(v, parse(range.slice(2))) >= 0;
  if (range.startsWith('^')) {
    const min = parse(range.slice(1));
    const max: Version = min[0] > 0 ? [min[0] + 1, 0, 0] : [0, min[1] + 1, 0];
    return compare(v, min) >= 0 && compare(v, max) < 0;
  }
  if (range.startsWith('~')) {
    const min = parse(range.slice(1));
    return compare(v, min) >= 0 && compare(v, [min[0], min[1] + 1, 0]) < 0;
  }
  return compare(v, parse(range)) === 0;
}
`,tests:[{name:`caret`,code:`expect(satisfies('22.2.3', '^22.1.0')).toBe(true);
expect(satisfies('22.0.9', '^22.1.0')).toBe(false);
expect(satisfies('23.0.0', '^22.1.0')).toBe(false);`},{name:`caret для 0.x`,code:`expect(satisfies('0.4.9', '^0.4.2')).toBe(true);
expect(satisfies('0.5.0', '^0.4.2')).toBe(false);`},{name:`tilde`,code:`expect(satisfies('22.1.7', '~22.1.0')).toBe(true);
expect(satisfies('22.2.0', '~22.1.0')).toBe(false);`},{name:`точная и >=`,code:`expect(satisfies('7.8.2', '7.8.2')).toBe(true);
expect(satisfies('7.8.1', '7.8.2')).toBe(false);
expect(satisfies('10.0.0', '>=9.1.0')).toBe(true);
expect(satisfies('9.0.9', '>=9.1.0')).toBe(false);
expect(satisfies('22.10.0', '^22.9.0')).toBe(true);`}],hints:[`Сравнивайте версии как кортежи чисел, а не как строки: "22.10.0" больше "22.9.0".`]},{id:`mcp-tool-dispatcher`,trackId:`ai-mcp`,title:`Мини MCP-сервер: tools/list и tools/call`,level:`middle`,language:`typescript`,relatedLessonId:`mcp-architecture`,description:"Реализуйте ядро MCP-сервера — обработчик JSON-RPC сообщений `createServer()` с методами `registerTool(definition, handler)` и `handle(message)`:\n\n- `tools/list` → `{ jsonrpc: '2.0', id, result: { tools: [{ name, description, inputSchema }] } }` в порядке регистрации;\n- `tools/call` с `params: { name, arguments }`:\n  - проверяет обязательные поля из `inputSchema.required` и типы `string`/`number`/`boolean` из `inputSchema.properties`; при ошибке аргументов — результат `{ content: [{ type: 'text', text: 'Invalid arguments: ...' }], isError: true }` (это ошибка выполнения, её должна увидеть модель);\n  - исключение обработчика — тоже `isError: true` с текстом ошибки;\n  - успех — `{ content: [{ type: 'text', text: <строка от обработчика> }], isError: false }`;\n- неизвестный инструмент → JSON-RPC ошибка `{ error: { code: -32602, message } }`;\n- неизвестный метод → `{ error: { code: -32601, message: 'Method not found' } }`.",starter:`type JsonSchema = {
  type: 'object';
  properties: Record<string, { type: 'string' | 'number' | 'boolean'; description?: string }>;
  required?: string[];
};
type ToolDefinition = { name: string; description: string; inputSchema: JsonSchema };
type Request = { jsonrpc: '2.0'; id: number; method: string; params?: any };

function createServer() {
  return {
    registerTool(definition: ToolDefinition, handler: (args: any) => Promise<string> | string): void {},
    async handle(message: Request): Promise<unknown> {
      return null;
    },
  };
}
`,solution:`type JsonSchema = {
  type: 'object';
  properties: Record<string, { type: 'string' | 'number' | 'boolean'; description?: string }>;
  required?: string[];
};
type ToolDefinition = { name: string; description: string; inputSchema: JsonSchema };
type Request = { jsonrpc: '2.0'; id: number; method: string; params?: any };
type Handler = (args: any) => Promise<string> | string;

const validate = (schema: JsonSchema, args: Record<string, unknown>): string | null => {
  for (const field of schema.required ?? []) {
    if (args[field] === undefined) return 'missing "' + field + '"';
  }
  for (const [field, value] of Object.entries(args)) {
    const expected = schema.properties[field]?.type;
    if (expected && typeof value !== expected) return '"' + field + '" must be ' + expected;
  }
  return null;
};

const textResult = (text: string, isError: boolean) => ({ content: [{ type: 'text', text }], isError });

function createServer() {
  const tools = new Map<string, { definition: ToolDefinition; handler: Handler }>();

  return {
    registerTool(definition: ToolDefinition, handler: Handler): void {
      tools.set(definition.name, { definition, handler });
    },

    async handle(message: Request): Promise<unknown> {
      const reply = (body: object) => ({ jsonrpc: '2.0', id: message.id, ...body });

      if (message.method === 'tools/list') {
        const list = [...tools.values()].map(({ definition }) => ({ ...definition }));
        return reply({ result: { tools: list } });
      }

      if (message.method === 'tools/call') {
        const tool = tools.get(message.params?.name);
        if (!tool) return reply({ error: { code: -32602, message: 'Unknown tool: ' + message.params?.name } });
        const args = message.params?.arguments ?? {};
        const problem = validate(tool.definition.inputSchema, args);
        if (problem) return reply({ result: textResult('Invalid arguments: ' + problem, true) });
        try {
          return reply({ result: textResult(await tool.handler(args), false) });
        } catch (error) {
          return reply({ result: textResult(error instanceof Error ? error.message : String(error), true) });
        }
      }

      return reply({ error: { code: -32601, message: 'Method not found' } });
    },
  };
}
`,tests:[{name:`tools/list`,code:`const server = createServer();
server.registerTool({ name: 'echo', description: '\u041F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442 \u0442\u0435\u043A\u0441\u0442', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } }, (a) => a.text);
const res = await server.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
expect(res.id).toBe(1);
expect(res.result.tools.map((t) => t.name)).toEqual(['echo']);
expect(res.result.tools[0].inputSchema.required).toEqual(['text']);`},{name:`tools/call: успех`,code:`const server = createServer();
server.registerTool({ name: 'add', description: '\u0421\u0443\u043C\u043C\u0430', inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] } }, (x) => String(x.a + x.b));
const res = await server.handle({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'add', arguments: { a: 2, b: 3 } } });
expect(res.result).toEqual({ content: [{ type: 'text', text: '5' }], isError: false });`},{name:`ошибки аргументов и обработчика — isError`,code:`const server = createServer();
server.registerTool({ name: 'add', description: '', inputSchema: { type: 'object', properties: { a: { type: 'number' } }, required: ['a'] } }, () => { throw new Error('\u0441\u0435\u0440\u0432\u0438\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D'); });
const missing = await server.handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'add', arguments: {} } });
expect(missing.result.isError).toBe(true);
expect(missing.result.content[0].text).toContain('Invalid arguments');
const wrongType = await server.handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'add', arguments: { a: '\u0434\u0432\u0430' } } });
expect(wrongType.result.isError).toBe(true);
const failed = await server.handle({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'add', arguments: { a: 1 } } });
expect(failed.result).toEqual({ content: [{ type: 'text', text: '\u0441\u0435\u0440\u0432\u0438\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D' }], isError: true });`},{name:`ошибки протокола`,code:`const server = createServer();
const unknownTool = await server.handle({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'nope', arguments: {} } });
expect(unknownTool.error.code).toBe(-32602);
const unknownMethod = await server.handle({ jsonrpc: '2.0', id: 7, method: 'resources/whatever' });
expect(unknownMethod).toEqual({ jsonrpc: '2.0', id: 7, error: { code: -32601, message: 'Method not found' } });`}],hints:[`Храните инструменты в Map по имени — это и порядок регистрации для tools/list.`,`Ошибки выполнения инструмента — это result с isError: true, а не JSON-RPC error: так модель увидит проблему и сможет исправиться.`]}];var m$1=[{id:`ts-typed-emitter`,trackId:`typescript`,title:`Типизированный EventEmitter`,level:`middle`,language:`typescript`,relatedLessonId:`generics`,description:"Реализуйте класс `TypedEmitter<Events>`, где `Events` — карта «имя события → тип данных».\n\n~~~ts\ntype AppEvents = { login: { userId: string }; logout: undefined };\nconst bus = new TypedEmitter<AppEvents>();\nbus.on('login', (p) => p.userId); // p: { userId: string }\nbus.emit('login', { userId: '1' });\n~~~\n\nМетоды: `on(event, handler)` возвращает функцию отписки, `emit(event, payload)`, `listenerCount(event)`.\n\nТесты проверяют поведение в рантайме, но постарайтесь, чтобы типы были точными: `emit('login', 42)` должен быть ошибкой компиляции.",starter:`class TypedEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    // \u0432\u0430\u0448 \u043A\u043E\u0434
    return () => {};
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    // \u0432\u0430\u0448 \u043A\u043E\u0434
  }

  listenerCount(event: keyof Events): number {
    return 0;
  }
}
`,solution:`type Handler<T> = (payload: T) => void;

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
`,tests:[{name:`вызывает обработчики с данными`,code:`const bus = new TypedEmitter();
const handler = spy();
bus.on('login', handler);
bus.emit('login', { userId: '1' });
expect(handler.calls).toEqual([[{ userId: '1' }]]);`},{name:`отписка`,code:`const bus = new TypedEmitter();
const handler = spy();
const off = bus.on('logout', handler);
off();
bus.emit('logout', undefined);
expect(handler.calls).toHaveLength(0);`},{name:`события независимы`,code:`const bus = new TypedEmitter();
const a = spy();
bus.on('a', a);
bus.emit('b', 1);
expect(a.calls).toHaveLength(0);`},{name:`listenerCount`,code:`const bus = new TypedEmitter();
const off = bus.on('x', () => {});
bus.on('x', () => {});
expect(bus.listenerCount('x')).toBe(2);
off();
expect(bus.listenerCount('x')).toBe(1);
expect(bus.listenerCount('y')).toBe(0);`}],hints:[`Храните Map<keyof Events, Set<обработчик>>.`,`Функция отписки — замыкание, удаляющее handler из Set.`]},{id:`ts-result`,trackId:`typescript`,title:`Тип Result вместо исключений`,level:`middle`,language:`typescript`,relatedLessonId:`narrowing`,description:"Смоделируйте результат операции как discriminated union и напишите хелперы:\n\n~~~ts\ntype Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };\n~~~\n\n- `ok(value)` и `err(error)` — конструкторы;\n- `mapResult(result, fn)` — применяет `fn` к значению успешного результата, ошибку пропускает как есть;\n- `unwrapOr(result, fallback)` — значение или запасное значение;\n- `parseAge(input: string)` — возвращает `ok(число)` для целого от 0 до 150, иначе `err('…')`.",starter:`type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function err<E>(error: E): Result<never, E> {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function parseAge(input: string): Result<number> {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}
`,solution:`type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

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
  if (!/^\\d+$/.test(input.trim())) return err('\u0412\u043E\u0437\u0440\u0430\u0441\u0442 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0446\u0435\u043B\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C');
  const age = Number(input);
  return age <= 150 ? ok(age) : err('\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0432\u043E\u0437\u0440\u0430\u0441\u0442');
}
`,tests:[{name:`конструкторы`,code:`expect(ok(1)).toEqual({ ok: true, value: 1 });
expect(err('x')).toEqual({ ok: false, error: 'x' });`},{name:`mapResult`,code:`expect(mapResult(ok(2), (n) => n * 10)).toEqual({ ok: true, value: 20 });
const failure = err('\u0441\u0431\u043E\u0439');
expect(mapResult(failure, (n) => n * 10)).toEqual(failure);`},{name:`unwrapOr`,code:`expect(unwrapOr(ok('a'), 'b')).toBe('a');
expect(unwrapOr(err('e'), 'b')).toBe('b');`},{name:`parseAge`,code:`expect(parseAge('42')).toEqual({ ok: true, value: 42 });
expect(parseAge(' 7 ')).toEqual({ ok: true, value: 7 });
expect(parseAge('abc').ok).toBe(false);
expect(parseAge('-5').ok).toBe(false);
expect(parseAge('4.5').ok).toBe(false);
expect(parseAge('200').ok).toBe(false);`}],hints:[`Проверка result.ok сужает тип до нужного варианта.`,`Ошибочный результат в mapResult можно вернуть как есть — его тип Result<never, E> совместим.`]},{id:`ts-traffic-light`,trackId:`typescript`,title:`Конечный автомат светофора`,level:`basic`,language:`typescript`,relatedLessonId:`narrowing`,description:"Состояние светофора — discriminated union:\n\n~~~ts\ntype Light =\n  | { color: 'red'; secondsLeft: number }\n  | { color: 'yellow'; next: 'red' | 'green' }\n  | { color: 'green'; pedestrianWaiting: boolean };\n~~~\n\nНапишите `next(light: Light): Light`:\n\n- red → yellow (`next: 'green'`);\n- yellow → цвет из поля `next`; для red начальное `secondsLeft = 30`, для green — `pedestrianWaiting: false`;\n- green → yellow (`next: 'red'`).\n\nИспользуйте `switch` с исчерпывающей проверкой через `never`.",starter:`type Light =
  | { color: 'red'; secondsLeft: number }
  | { color: 'yellow'; next: 'red' | 'green' }
  | { color: 'green'; pedestrianWaiting: boolean };

function next(light: Light): Light {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
  return light;
}
`,solution:`type Light =
  | { color: 'red'; secondsLeft: number }
  | { color: 'yellow'; next: 'red' | 'green' }
  | { color: 'green'; pedestrianWaiting: boolean };

const assertNever = (value: never): never => {
  throw new Error('\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435: ' + JSON.stringify(value));
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
`,tests:[{name:`red → yellow → green`,code:`const yellow = next({ color: 'red', secondsLeft: 0 });
expect(yellow).toEqual({ color: 'yellow', next: 'green' });
expect(next(yellow)).toEqual({ color: 'green', pedestrianWaiting: false });`},{name:`green → yellow → red`,code:`const yellow = next({ color: 'green', pedestrianWaiting: true });
expect(yellow).toEqual({ color: 'yellow', next: 'red' });
expect(next(yellow)).toEqual({ color: 'red', secondsLeft: 30 });`},{name:`полный цикл возвращается к началу`,code:`let light = { color: 'red', secondsLeft: 30 };
for (let i = 0; i < 4; i++) light = next(light);
expect(light).toEqual({ color: 'red', secondsLeft: 30 });`}],hints:[`switch (light.color) сужает тип в каждой ветке.`,`В default вызовите функцию, принимающую never.`]},{id:`ts-undo-history`,trackId:`typescript`,title:`История с undo/redo`,level:`middle`,language:`typescript`,relatedLessonId:`generics`,description:"Напишите `createHistory<T>(initial: T)`, возвращающую объект:\n\n- `present()` — текущее значение;\n- `set(value)` — новое значение (очищает ветку redo);\n- `undo()` / `redo()` — переход назад и вперёд, ничего не делают, если некуда;\n- `canUndo()` / `canRedo()`.\n\nЭто паттерн хранения снимков состояния — основа undo в редакторах (см. урок о паттерне Command).",starter:`type History<T> = {
  present(): T;
  set(value: T): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
};

function createHistory<T>(initial: T): History<T> {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}
`,solution:`type History<T> = {
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
`,tests:[{name:`set и present`,code:`const h = createHistory(1);
h.set(2);
expect(h.present()).toBe(2);`},{name:`undo и redo`,code:`const h = createHistory('a');
h.set('b'); h.set('c');
h.undo();
expect(h.present()).toBe('b');
h.undo();
expect(h.present()).toBe('a');
h.redo();
expect(h.present()).toBe('b');`},{name:`set очищает redo`,code:`const h = createHistory(0);
h.set(1); h.undo();
expect(h.canRedo()).toBe(true);
h.set(5);
expect(h.canRedo()).toBe(false);
expect(h.present()).toBe(5);`},{name:`границы истории`,code:`const h = createHistory('x');
expect(h.canUndo()).toBe(false);
h.undo();
h.redo();
expect(h.present()).toBe('x');`}],hints:[`Храните три части: past (массив), present, future (массив).`,`undo переносит present в начало future, а последний элемент past делает present.`]},{id:`ts-lru-cache`,trackId:`typescript`,title:`LRU-кеш`,level:`advanced`,language:`typescript`,relatedLessonId:`generics`,description:"Реализуйте `LRUCache<K, V>` с ограниченной вместимостью:\n\n- `get(key)` возвращает значение или `undefined` и делает ключ «самым свежим»;\n- `set(key, value)` добавляет или обновляет значение; при превышении вместимости удаляется **давно не использовавшийся** ключ;\n- `size` — текущее количество элементов.\n\nОбе операции должны работать за O(1). Подсказка: `Map` помнит порядок вставки.",starter:`class LRUCache<K, V> {
  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    return undefined;
  }

  set(key: K, value: V): void {}

  get size(): number {
    return 0;
  }
}
`,solution:`class LRUCache<K, V> {
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
`,tests:[{name:`вытесняет самый старый ключ`,code:`const cache = new LRUCache(2);
cache.set('a', 1); cache.set('b', 2); cache.set('c', 3);
expect(cache.get('a')).toBeUndefined();
expect(cache.get('b')).toBe(2);
expect(cache.size).toBe(2);`},{name:`get обновляет свежесть`,code:`const cache = new LRUCache(2);
cache.set('a', 1); cache.set('b', 2);
cache.get('a');
cache.set('c', 3);
expect(cache.get('a')).toBe(1);
expect(cache.get('b')).toBeUndefined();`},{name:`обновление значения не увеличивает размер`,code:`const cache = new LRUCache(2);
cache.set('a', 1); cache.set('a', 10);
expect(cache.size).toBe(1);
expect(cache.get('a')).toBe(10);`},{name:`хранит falsy-значения`,code:`const cache = new LRUCache(3);
cache.set('zero', 0);
expect(cache.get('zero')).toBe(0);`}],hints:[`Чтобы сделать ключ «свежим», удалите и вставьте его заново.`,`Самый старый ключ — первый в map.keys().`]},{id:`ts-pick-omit`,trackId:`typescript`,title:`pick и omit с точными типами`,level:`basic`,language:`typescript`,relatedLessonId:`utility-types`,description:`\u0420\u0435\u0430\u043B\u0438\u0437\u0443\u0439\u0442\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438, \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0443\u0442\u0438\u043B\u0438\u0442\u0430\u0440\u043D\u044B\u043C \u0442\u0438\u043F\u0430\u043C:

~~~ts
pick(user, ['id', 'name']); // Pick<User, 'id' | 'name'>
omit(user, ['password']); // Omit<User, 'password'>
~~~

\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043E\u0431\u044A\u0435\u043A\u0442 \u043D\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u0438\u0437\u043C\u0435\u043D\u044F\u0442\u044C\u0441\u044F. \u041A\u043B\u044E\u0447\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 \u043E\u0431\u044A\u0435\u043A\u0442\u0435, \u0432 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043D\u0435 \u043F\u043E\u043F\u0430\u0434\u0430\u044E\u0442.`,starter:`function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}
`,solution:`function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
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
`,tests:[{name:`pick`,code:`const user = { id: 1, name: '\u0410\u043D\u043D\u0430', password: 'secret' };
expect(pick(user, ['id', 'name'])).toEqual({ id: 1, name: '\u0410\u043D\u043D\u0430' });`},{name:`omit`,code:`const user = { id: 1, name: '\u0410\u043D\u043D\u0430', password: 'secret' };
expect(omit(user, ['password'])).toEqual({ id: 1, name: '\u0410\u043D\u043D\u0430' });`},{name:`исходный объект не меняется`,code:`const user = { id: 1, password: 'x' };
omit(user, ['password']);
pick(user, ['id']);
expect(user).toEqual({ id: 1, password: 'x' });`},{name:`отсутствующие ключи не добавляются`,code:`const result = pick({ a: 1 }, ['a', 'b']);
expect(Object.keys(result)).toEqual(['a']);`}],hints:[`Для omit удобно Object.entries + filter + Object.fromEntries.`,`Здесь допустим as — объект собирается в следующих строках.`]},{id:`ts-type-guard`,trackId:`typescript`,title:`Валидация данных на границе`,level:`middle`,language:`typescript`,relatedLessonId:`narrowing`,description:`\u0421 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \`unknown\`. \u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0447\u0435\u0441\u0442\u043D\u044B\u0439 type guard \`isUser(value: unknown): value is User\`:

~~~ts
type User = {
  id: string;
  email: string;
  age: number | null;
  roles: ('admin' | 'editor' | 'viewer')[];
};
~~~

\u0418 \u0444\u0443\u043D\u043A\u0446\u0438\u044E \`parseUsers(json: string): User[]\`, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u0430\u043B\u0438\u0434\u043D\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u0438\u0437 JSON-\u043C\u0430\u0441\u0441\u0438\u0432\u0430 (\u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 JSON \u0438\u043B\u0438 \u043D\u0435 \u043C\u0430\u0441\u0441\u0438\u0432 \u2014 \u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u043F\u0438\u0441\u043E\u043A).`,starter:`type Role = 'admin' | 'editor' | 'viewer';
type User = { id: string; email: string; age: number | null; roles: Role[] };

function isUser(value: unknown): value is User {
  return false;
}

function parseUsers(json: string): User[] {
  return [];
}
`,solution:`type Role = 'admin' | 'editor' | 'viewer';
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
`,tests:[{name:`валидный пользователь`,code:`expect(isUser({ id: '1', email: 'a@b.ru', age: 30, roles: ['admin'] })).toBe(true);
expect(isUser({ id: '1', email: 'a@b.ru', age: null, roles: [] })).toBe(true);`},{name:`неверные поля`,code:`expect(isUser({ id: 1, email: 'a@b.ru', age: 1, roles: [] })).toBe(false);
expect(isUser({ id: '1', email: '\u0431\u0435\u0437 \u0441\u043E\u0431\u0430\u043A\u0438', age: 1, roles: [] })).toBe(false);
expect(isUser({ id: '1', email: 'a@b.ru', age: '30', roles: [] })).toBe(false);
expect(isUser({ id: '1', email: 'a@b.ru', age: 1, roles: ['root'] })).toBe(false);`},{name:`не объект`,code:`expect(isUser(null)).toBe(false);
expect(isUser('user')).toBe(false);
expect(isUser([])).toBe(false);`},{name:`parseUsers фильтрует и переживает мусор`,code:`const json = JSON.stringify([{ id: '1', email: 'a@b.ru', age: 1, roles: [] }, { id: 2 }]);
expect(parseUsers(json)).toHaveLength(1);
expect(parseUsers('{ \u043D\u0435 json')).toEqual([]);
expect(parseUsers('{"a":1}')).toEqual([]);`}],hints:[`Сначала проверьте, что это объект, затем каждое поле.`,`Массив тоже typeof object — исключите его через Array.isArray.`]},{id:`ts-pipe`,trackId:`typescript`,title:`Композиция функций pipe`,level:`middle`,language:`typescript`,relatedLessonId:`generics`,description:`\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \`pipe(...fns)\` \u2014 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0444\u0443\u043D\u043A\u0446\u0438\u044E, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0447\u0435\u0440\u0435\u0437 \u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u0441\u043B\u0435\u0432\u0430 \u043D\u0430\u043F\u0440\u0430\u0432\u043E:

~~~ts
const slugify = pipe(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\\s+/g, '-'),
);
slugify('  Hello World '); // 'hello-world'
~~~

\u0411\u0435\u0437 \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \`pipe()\` \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0444\u0443\u043D\u043A\u0446\u0438\u044E-\u0438\u0434\u0435\u043D\u0442\u0438\u0447\u043D\u043E\u0441\u0442\u044C. \u0422\u0430\u043A \u0443\u0441\u0442\u0440\u043E\u0435\u043D \`pipe\` \u0432 RxJS.

\u0422\u043E\u0447\u043D\u0430\u044F \u0442\u0438\u043F\u0438\u0437\u0430\u0446\u0438\u044F \`pipe\` \u0434\u043B\u044F \u043B\u044E\u0431\u043E\u0433\u043E \u0447\u0438\u0441\u043B\u0430 \u0444\u0443\u043D\u043A\u0446\u0438\u0439 \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043F\u0435\u0440\u0435\u0433\u0440\u0443\u0437\u043E\u043A (\u0442\u0430\u043A \u0441\u0434\u0435\u043B\u0430\u043D\u043E \u0432 RxJS) \u2014 \u0437\u0434\u0435\u0441\u044C \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \`any\` \u0432 \u0441\u0438\u0433\u043D\u0430\u0442\u0443\u0440\u0435, \u0441\u043E\u0441\u0440\u0435\u0434\u043E\u0442\u043E\u0447\u044C\u0442\u0435\u0441\u044C \u043D\u0430 \u0440\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438.`,starter:`function pipe(...fns: Array<(value: any) => any>): (value: any) => any {
  // \u0432\u0430\u0448 \u043A\u043E\u0434
  return (value) => value;
}
`,solution:`function pipe(...fns: Array<(value: any) => any>): (value: any) => any {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}
`,tests:[{name:`слева направо`,code:`const calc = pipe((n) => n + 1, (n) => n * 10);
expect(calc(1)).toBe(20);`},{name:`строки`,code:`const slugify = pipe((s) => s.trim(), (s) => s.toLowerCase(), (s) => s.replace(/\\s+/g, '-'));
expect(slugify('  Hello World ')).toBe('hello-world');`},{name:`пустой pipe`,code:`expect(pipe()('x')).toBe('x');`},{name:`функции вызываются по одному разу`,code:`const f = spy((x) => x);
pipe(f, f)(1);
expect(f.calls).toHaveLength(2);`}],hints:[`reduce по массиву функций с начальным значением value.`]},{id:`ts-money`,trackId:`typescript`,title:`Value object Money`,level:`middle`,language:`typescript`,relatedLessonId:`compatibility`,description:"Деньги нельзя хранить в `number` с дробями (`0.1 + 0.2`). Реализуйте неизменяемый value object на копейках:\n\n- `money(amount: number, currency: 'RUB' | 'USD')` — сумма в рублях/долларах, внутри хранится целое число минимальных единиц (`minor`);\n- `add(a, b)` — сложение, при разных валютах бросает ошибку;\n- `allocate(m, parts)` — делит сумму на `parts` частей так, чтобы сумма частей была равна исходной (остаток копеек распределяется по первым частям);\n- `format(m)` — строка вида `'10.50 RUB'`.",starter:`type Currency = 'RUB' | 'USD';
type Money = { readonly minor: number; readonly currency: Currency };

function money(amount: number, currency: Currency): Money {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function add(a: Money, b: Money): Money {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function allocate(m: Money, parts: number): Money[] {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}

function format(m: Money): string {
  throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
}
`,solution:`type Currency = 'RUB' | 'USD';
type Money = { readonly minor: number; readonly currency: Currency };

function money(amount: number, currency: Currency): Money {
  return Object.freeze({ minor: Math.round(amount * 100), currency });
}

function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('\u041D\u0435\u043B\u044C\u0437\u044F \u0441\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0442\u044C \u0440\u0430\u0437\u043D\u044B\u0435 \u0432\u0430\u043B\u044E\u0442\u044B');
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
`,tests:[{name:`точная арифметика`,code:`const sum = add(money(0.1, 'RUB'), money(0.2, 'RUB'));
expect(sum.minor).toBe(30);
expect(format(sum)).toBe('0.30 RUB');`},{name:`разные валюты`,code:`expect(() => add(money(1, 'RUB'), money(1, 'USD'))).toThrow('валют');`},{name:`allocate без потери копеек`,code:`const parts = allocate(money(100, 'RUB'), 3);
expect(parts.map((p) => p.minor)).toEqual([3334, 3333, 3333]);
expect(parts.reduce((s, p) => s + p.minor, 0)).toBe(10000);`},{name:`неизменяемость`,code:`const m = money(5, 'USD');
expect(Object.isFrozen(m)).toBe(true);`}],hints:[`Храните целые копейки: Math.round(amount * 100).`,`В allocate остаток от деления раздайте по одной копейке первым частям.`]},{id:`ts-static-counter`,trackId:`typescript`,title:`Счётчик экземпляров на static`,level:`basic`,language:`typescript`,relatedLessonId:`classes`,description:"Реализуйте класс `User`, который сам ведёт учёт своих экземпляров через `static`-члены.\n\n- `new User(name)` присваивает экземпляру `readonly id` по порядку: 1, 2, 3…\n- `static create(name)` — фабрика: обрезает пробелы, для пустого имени бросает `Error('Имя обязательно')`.\n- `static get count` — сколько экземпляров создано.\n- `static reset()` — сбрасывает счётчики (нужно тестам).\n- Наследник `class Admin extends User {}` должен работать без изменений: `Admin.create('Ира')` возвращает именно `Admin`, а не `User`.\n\n~~~ts\nUser.create('  Анна ').name; // 'Анна'\nUser.count; // 1\nnew User('Олег').count; // undefined — static не виден через экземпляр\n~~~\n\nПодсказка к последнему пункту: внутри static-метода `this` — это конструктор, через который метод вызвали.",starter:`class User {
  readonly id: number;

  constructor(readonly name: string) {
    this.id = 0;
  }

  static create(name: string): User {
    throw new Error('\u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043E');
  }

  static get count(): number {
    return 0;
  }

  static reset(): void {}
}

class Admin extends User {}
`,solution:`class User {
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
      throw new Error('\u0418\u043C\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E');
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
`,tests:[{name:`id выдаются по порядку`,code:`User.reset();
const a = new User('a');
const b = new User('b');
expect([a.id, b.id]).toEqual([1, 2]);`},{name:`count считает экземпляры`,code:`User.reset();
User.create('a');
new User('b');
expect(User.count).toBe(2);`},{name:`фабрика обрезает пробелы и проверяет имя`,code:`User.reset();
expect(User.create('  \u0410\u043D\u043D\u0430 ').name).toBe('\u0410\u043D\u043D\u0430');
expect(() => User.create('   ')).toThrow('\u0418\u043C\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E');`},{name:`static не виден через экземпляр`,code:`User.reset();
const user = new User('x');
expect(user.count).toBeUndefined();
expect(user.create).toBeUndefined();`},{name:`фабрика наследника создаёт наследника`,code:`User.reset();
const admin = Admin.create('\u0418\u0440\u0430');
expect(admin).toBeInstanceOf(Admin);
expect(admin.id).toBe(1);
expect(User.count).toBe(1);`},{name:`reset сбрасывает счётчики`,code:`User.reset();
new User('a');
User.reset();
expect(User.count).toBe(0);
expect(new User('b').id).toBe(1);`}],hints:[`Храните счётчики в private static полях и обращайтесь к ним через User.nextId, а не через this — иначе у Admin появятся свои копии.`,`Для полиморфной фабрики объявите параметр this: static create<T extends User>(this: new (name: string) => T, name: string): T и вызовите new this(...).`]},{id:`ts-private-account`,trackId:`typescript`,title:`Банковский счёт с #private`,level:`basic`,language:`typescript`,relatedLessonId:`classes`,description:"Модификатор `private` из TypeScript исчезает после компиляции: поле видно в `JSON.stringify` и меняется снаружи. Сделайте счёт, у которого баланс защищён по-настоящему — через `#private`.\n\nКласс `BankAccount`:\n\n- `constructor(readonly owner: string, initial = 0)`;\n- `get balance` — только для чтения, сеттера нет;\n- `deposit(amount)` и `withdraw(amount)` — для суммы ≤ 0 бросают `RangeError('Сумма должна быть положительной')`, при нехватке денег `withdraw` бросает `Error('Недостаточно средств')`;\n- `get history` — массив операций (`+100`, `-30` как числа 100 и -30); снаружи изменить историю нельзя — возвращайте копию;\n- `static isAccount(value)` — проверка через `#balance in value`.\n\nВ итоге `JSON.stringify(account)` должен давать только `{\"owner\":\"…\"}`.",starter:`class BankAccount {
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
`,solution:`class BankAccount {
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
      throw new Error('\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432');
    }
    this.#balance -= amount;
    this.#history.push(-amount);
  }

  #assertPositive(amount: number): void {
    if (!(amount > 0)) {
      throw new RangeError('\u0421\u0443\u043C\u043C\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0439');
    }
  }

  static isAccount(value: object): value is BankAccount {
    return #balance in value;
  }
}
`,tests:[{name:`пополнение и списание`,code:`const account = new BankAccount('\u0410\u043D\u043D\u0430', 100);
account.deposit(50);
account.withdraw(30);
expect(account.balance).toBe(120);
expect(account.history).toEqual([50, -30]);`},{name:`ошибки валидации`,code:`const account = new BankAccount('\u0410\u043D\u043D\u0430', 10);
expect(() => account.deposit(0)).toThrow('\u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0439');
expect(() => account.withdraw(-5)).toThrow('\u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0439');
expect(() => account.withdraw(11)).toThrow('\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432');
expect(account.balance).toBe(10);`},{name:`баланс нельзя присвоить снаружи`,code:`const account = new BankAccount('\u0410\u043D\u043D\u0430', 10);
expect(() => { account.balance = 1000; }).toThrow();
expect(account.balance).toBe(10);`},{name:`баланс не утекает в JSON и Object.keys`,code:`const account = new BankAccount('\u0410\u043D\u043D\u0430', 10);
expect(JSON.stringify(account)).toBe('{"owner":"\u0410\u043D\u043D\u0430"}');
expect(Object.keys(account)).toEqual(['owner']);`},{name:`история защищена от изменений`,code:`const account = new BankAccount('\u0410\u043D\u043D\u0430');
account.deposit(5);
account.history.push(1000);
expect(account.history).toEqual([5]);`},{name:`brand check`,code:`expect(BankAccount.isAccount(new BankAccount('x'))).toBe(true);
expect(BankAccount.isAccount({ balance: 1, owner: 'x' })).toBe(false);`}],hints:[`Объявите #balance и #history и дайте к ним только геттеры — присваивание свойству без сеттера в strict mode бросает TypeError.`,`Повторяющуюся проверку суммы вынесите в приватный метод #assertPositive.`]},{id:`ts-abstract-shapes`,trackId:`typescript`,title:`Абстрактные фигуры и protected`,level:`middle`,language:`typescript`,relatedLessonId:`classes`,description:"Постройте иерархию фигур на абстрактном классе — это паттерн «шаблонный метод».\n\n~~~ts\nabstract class Shape {\n  constructor(readonly name: string) {}\n  abstract area(): number;\n  abstract perimeter(): number;\n  describe(): string; // 'круг: S=3.14, P=6.28' — два знака после запятой\n  static compareByArea(a: Shape, b: Shape): number; // для sort по возрастанию площади\n}\n~~~\n\nНаследники:\n\n- `Circle(radius)` — имя `'круг'`;\n- `Rectangle(width, height)` — имя `'прямоугольник'`, стороны храните в `protected readonly` полях;\n- `Square(side) extends Rectangle` — имя `'квадрат'`. Подумайте, как передать имя через конструктор `Rectangle`, не делая его публичным параметром.\n\n`abstract` защищает только при компиляции. Добавьте рантайм-проверку: `new Shape('x')` (например, из JavaScript) должен бросать `TypeError`. Используйте `new.target`.",starter:`abstract class Shape {
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
    super('\u043A\u0440\u0443\u0433');
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
    super('\u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A');
  }
  area(): number {
    return 0;
  }
  perimeter(): number {
    return 0;
  }
}

class Square extends Rectangle {}
`,solution:`abstract class Shape {
  constructor(readonly name: string) {
    if (new.target === Shape) {
      throw new TypeError('Shape \u2014 \u0430\u0431\u0441\u0442\u0440\u0430\u043A\u0442\u043D\u044B\u0439 \u043A\u043B\u0430\u0441\u0441');
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
    super('\u043A\u0440\u0443\u0433');
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
    name = '\u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A',
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
    super(side, side, '\u043A\u0432\u0430\u0434\u0440\u0430\u0442');
  }
}
`,tests:[{name:`describe у круга`,code:`expect(new Circle(1).describe()).toBe('круг: S=3.14, P=6.28');`},{name:`прямоугольник`,code:`const rect = new Rectangle(2, 3);
expect(rect.area()).toBe(6);
expect(rect.describe()).toBe('\u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A: S=6.00, P=10.00');`},{name:`квадрат наследует прямоугольник`,code:`const square = new Square(4);
expect(square.describe()).toBe('\u043A\u0432\u0430\u0434\u0440\u0430\u0442: S=16.00, P=16.00');
expect(square).toBeInstanceOf(Rectangle);
expect(square).toBeInstanceOf(Shape);`},{name:`сортировка по площади`,code:`const shapes = [new Square(3), new Circle(1), new Rectangle(1, 2)];
expect(shapes.sort(Shape.compareByArea).map((s) => s.name)).toEqual(['\u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A', '\u043A\u0440\u0443\u0433', '\u043A\u0432\u0430\u0434\u0440\u0430\u0442']);`},{name:`абстрактный класс нельзя создать в рантайме`,code:`expect(() => new Shape('x')).toThrow();
expect(() => new Circle(1)).not.toThrow();`}],hints:[`new.target внутри конструктора — это класс, к которому применили new. Для new Circle() это Circle, для new Shape() — Shape.`,`Добавьте в Rectangle третий параметр name со значением по умолчанию и передайте его в super(name). Square вызовет super(side, side, 'квадрат').`]},{id:`ts-singleton-config`,trackId:`typescript`,title:`Singleton с приватным конструктором`,level:`middle`,language:`typescript`,relatedLessonId:`classes`,description:"Сделайте класс конфигурации `AppConfig`, у которого может быть только один экземпляр.\n\n- `private constructor` — запрещает `new AppConfig()` при компиляции;\n- `static get instance` — лениво создаёт и всегда возвращает один и тот же экземпляр;\n- `set(key, value)` возвращает `this`, чтобы вызовы можно было цепочкой;\n- `get(key, fallback?)` — значение или `fallback` (по умолчанию `undefined`);\n- `static resetForTests()` — забывает текущий экземпляр.\n\nМодификатор `private` у конструктора в JavaScript исчезает. Добавьте рантайм-защиту: вызов `new AppConfig()` снаружи должен бросать `Error('Используйте AppConfig.instance')`. Подойдёт приватное статическое поле-флаг, которое поднимается только внутри `instance`.",starter:`class AppConfig {
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
`,solution:`class AppConfig {
  static #instance: AppConfig | undefined;
  static #creating = false;

  readonly #values = new Map<string, unknown>();

  private constructor() {
    if (!AppConfig.#creating) {
      throw new Error('\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 AppConfig.instance');
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
`,tests:[{name:`один и тот же экземпляр`,code:`AppConfig.resetForTests();
expect(AppConfig.instance).toBe(AppConfig.instance);`},{name:`состояние общее`,code:`AppConfig.resetForTests();
AppConfig.instance.set('apiUrl', '/api').set('retries', 3);
expect(AppConfig.instance.get('apiUrl')).toBe('/api');
expect(AppConfig.instance.get('retries')).toBe(3);`},{name:`fallback`,code:`AppConfig.resetForTests();
expect(AppConfig.instance.get('missing', 42)).toBe(42);
expect(AppConfig.instance.get('missing')).toBeUndefined();
AppConfig.instance.set('zero', 0);
expect(AppConfig.instance.get('zero', 5)).toBe(0);`},{name:`new снаружи запрещён в рантайме`,code:`AppConfig.resetForTests();
expect(() => new AppConfig()).toThrow('AppConfig.instance');
expect(AppConfig.instance).toBeInstanceOf(AppConfig);`},{name:`resetForTests создаёт новый экземпляр`,code:`AppConfig.resetForTests();
const first = AppConfig.instance;
first.set('a', 1);
AppConfig.resetForTests();
expect(AppConfig.instance).not.toBe(first);
expect(AppConfig.instance.get('a')).toBeUndefined();`}],hints:[`Храните экземпляр в static #instance и создавайте его только при первом обращении к геттеру.`,`Флаг static #creating поднимайте прямо перед new внутри instance и опускайте в finally.`,`Различайте «ключа нет» и «значение равно 0»: используйте Map.has, а не ??.`]}];var g$3=[{id:`web-cache-control`,trackId:`web`,title:`Разбор Cache-Control`,level:`basic`,language:`typescript`,relatedLessonId:`http`,description:"Напишите `parseCacheControl(header)`, разбирающую заголовок в объект, и `isFresh(header, ageSeconds)`:\n\n~~~ts\nparseCacheControl('public, max-age=3600, immutable');\n// { public: true, 'max-age': 3600, immutable: true }\n~~~\n\n- директивы без значения → `true`, числовые значения → `number`, остальные — строки без кавычек;\n- регистр директив не важен, пробелы игнорируются;\n- `isFresh` — `true`, если нет `no-store`/`no-cache` и `ageSeconds < max-age`.",starter:`type CacheControl = Record<string, string | number | true>;

function parseCacheControl(header: string): CacheControl {
  return {};
}

function isFresh(header: string, ageSeconds: number): boolean {
  return false;
}
`,solution:`type CacheControl = Record<string, string | number | true>;

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
`,tests:[{name:`разбор директив`,code:`expect(parseCacheControl('public, max-age=3600, immutable')).toEqual({ public: true, 'max-age': 3600, immutable: true });`},{name:`регистр, пробелы и кавычки`,code:`expect(parseCacheControl(' Private ,MAX-AGE=60 , no-cache="Set-Cookie"')).toEqual({ private: true, 'max-age': 60, 'no-cache': 'Set-Cookie' });`},{name:`свежесть`,code:`expect(isFresh('max-age=60', 30)).toBe(true);
expect(isFresh('max-age=60', 61)).toBe(false);
expect(isFresh('no-cache, max-age=60', 1)).toBe(false);
expect(isFresh('no-store', 0)).toBe(false);
expect(isFresh('public', 0)).toBe(false);`}],hints:[`split(",") по директивам, затем split("=") на имя и значение.`]},{id:`web-query-string`,trackId:`web`,title:`Query-строка туда и обратно`,level:`basic`,language:`typescript`,relatedLessonId:`http`,description:"Реализуйте пару функций без `URLSearchParams`:\n\n- `stringifyQuery({ q: 'angular signals', tags: ['a', 'b'], page: 2, empty: undefined })` → `'q=angular%20signals&tags=a&tags=b&page=2'` (`undefined` и `null` пропускаются, массивы — повтором ключа, значения кодируются `encodeURIComponent`);\n- `parseQuery('?q=angular%20signals&tags=a&tags=b&flag')` → `{ q: 'angular signals', tags: ['a', 'b'], flag: '' }` (повторяющиеся ключи собираются в массив, ведущий `?` необязателен, `+` означает пробел).",starter:`type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];

function stringifyQuery(params: Record<string, QueryValue>): string {
  return '';
}

function parseQuery(query: string): Record<string, string | string[]> {
  return {};
}
`,solution:`type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];

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
`,tests:[{name:`stringify`,code:`expect(stringifyQuery({ q: 'angular signals', tags: ['a', 'b'], page: 2, empty: undefined, nil: null }))
  .toBe('q=angular%20signals&tags=a&tags=b&page=2');`},{name:`parse`,code:`expect(parseQuery('?q=angular%20signals&tags=a&tags=b&flag')).toEqual({ q: 'angular signals', tags: ['a', 'b'], flag: '' });`},{name:`плюс и спецсимволы`,code:`expect(parseQuery('city=%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C&text=a+b')).toEqual({ city: '\u041A\u0430\u0437\u0430\u043D\u044C', text: 'a b' });
expect(stringifyQuery({ expr: 'a&b=c' })).toBe('expr=a%26b%3Dc');`},{name:`туда и обратно`,code:`const params = { search: '\u043A\u043E\u0444\u0435 & \u0447\u0430\u0439', page: 3 };
expect(parseQuery(stringifyQuery(params))).toEqual({ search: '\u043A\u043E\u0444\u0435 & \u0447\u0430\u0439', page: '3' });`}],hints:[`encodeURIComponent и decodeURIComponent решают кодирование; + нужно заменить на пробел до декодирования.`]},{id:`web-layout-batch`,trackId:`web`,title:`Без layout thrashing`,level:`middle`,language:`typescript`,relatedLessonId:`rendering`,description:`Модель DOM ниже считает, сколько раз браузеру пришлось выполнить layout: каждое **чтение** геометрии после **записи** стиля вызывает принудительный layout.

Функция \`equalizeHeights(elements)\` должна выставить всем элементам высоту, равную максимальной. Текущая реализация чередует чтение и запись. Перепишите её так, чтобы layout выполнялся **не более одного раза** при любом количестве элементов.`,starter:`class FakeElement {
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
`,solution:`class FakeElement {
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
  // \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u0441\u0435 \u0447\u0442\u0435\u043D\u0438\u044F\u2026
  const max = Math.max(0, ...elements.map((el) => el.offsetHeight));
  // \u2026\u043F\u043E\u0442\u043E\u043C \u0432\u0441\u0435 \u0437\u0430\u043F\u0438\u0441\u0438
  for (const el of elements) {
    el.setHeight(max);
  }
}
`,tests:[{name:`высоты выровнены`,code:`FakeElement.layouts = 0; FakeElement.dirty = false;
const items = [10, 40, 25].map((h) => new FakeElement(h));
equalizeHeights(items);
expect(items.map((el) => el.offsetHeight)).toEqual([40, 40, 40]);`},{name:`не больше одного layout`,code:`FakeElement.layouts = 0; FakeElement.dirty = false;
const items = Array.from({ length: 50 }, (_, i) => new FakeElement(i));
equalizeHeights(items);
expect(FakeElement.layouts).toBeLessThan(2);`}],hints:[`Сгруппируйте: сначала прочитайте все высоты, затем запишите все значения.`]}];var h$1=[...l$1,...m$1,...i$1,...u$1,...g$3,...d,...c$1,...p];var y=new I(`EXERCISE_REGISTRY`,{providedIn:`root`,factory:()=>h$1});var f$1=class s{exercises=h$2(y);find(t){return this.exercises.find(e=>e.id===t)}byTrack(t){return this.exercises.filter(e=>e.trackId===t)}forLesson(t,e){return this.exercises.filter(r=>r.trackId===t&&r.relatedLessonId===e)}next(t){let e=this.exercises.findIndex(r=>r.id===t);return e===-1?void 0:this.exercises[e+1]}static ɵfac=function(e){return new(e||s)};static ɵprov=_({token:s,factory:s.ɵfac,providedIn:`root`})};var h=12;var s=i=>i.toLowerCase().replace(/ё/g,`е`);var g$2=class i{catalog=h$2(hE);exercises=h$2(f$1);index=this.buildIndex();isOpen=V(!1);query=V(``);hits=Oe(()=>{let n=s(this.query()).split(/\s+/).filter(Boolean);return n.length===0?this.index.filter(e=>e.kind===`track`):this.index.filter(e=>n.every(a=>e.haystack.includes(a))).map(e=>({hit:e,score:m(e,n)})).sort((e,a)=>a.score-e.score).slice(0,h).map(({hit:e})=>e)});open(){this.query.set(``),this.isOpen.set(!0)}close(){this.isOpen.set(!1)}buildIndex(){let n=this.catalog.tracks.map(t=>({kind:`track`,title:t.title,context:`Трек`,url:`/tracks/${t.id}`,accent:t.accent,titleKey:s(t.title),haystack:s(`${t.title} ${t.short} ${t.description}`)})),e=this.catalog.lessons.map(({track:t,section:r,lesson:o})=>({kind:`lesson`,title:o.title,context:`${t.title} / ${r.title}`,url:`/tracks/${t.id}/${o.id}`,accent:t.accent,titleKey:s(o.title),haystack:s(`${o.title} ${o.summary} ${o.tags.join(` `)} ${t.title} ${t.short}`)})),a=this.exercises.exercises.map(t=>{let r=this.catalog.findTrack(t.trackId);return{kind:`exercise`,title:t.title,context:`\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0430 / ${r?.title??t.trackId}`,url:`/practice/${t.id}`,accent:r?.accent??`currentColor`,titleKey:s(t.title),haystack:s(`${t.title} \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430 \u0437\u0430\u0434\u0430\u0447\u0430 ${r?.title??``}`)}});return[...n,...e,...a]}static ɵfac=function(e){return new(e||i)};static ɵprov=_({token:i,factory:i.ɵfac,providedIn:`root`})};var m=(i,n)=>{let e=n.filter(r=>i.titleKey.includes(r)).length,a=n.some(r=>i.titleKey.startsWith(r))?2:0,t=i.kind===`lesson`?1:i.kind===`track`?1.5:0;return e*3+a+t};var l=6e3;var g$1=e=>{if(typeof e!=`object`||e===null)return!1;let n=Reflect.get(e,`kind`);return n===`completed`||n===`compile-error`||n===`timeout`};var i=class e{languages=[`javascript`,`typescript`];run(n){return new Promise(r=>{let t=new Worker(new URL(`worker-HET6ITMT.js`,import.meta.url),{type:`module`}),u=o=>{clearTimeout(d),t.terminate(),r(o)},d=setTimeout(()=>u({kind:`timeout`,limitMs:l}),l);t.addEventListener(`message`,o=>{u(g$1(o.data)?o.data:{kind:`compile-error`,message:`Песочница вернула неожиданный ответ`,logs:[]})}),t.addEventListener(`error`,o=>u({kind:`compile-error`,message:o.message||`Ошибка песочницы`,logs:[]})),t.postMessage(n)})}static ɵfac=function(r){return new(r||e)};static ɵprov=_({token:e,factory:e.ɵfac})};var R$1=new I(`CODE_RUNNERS`);var w=()=>[{provide:R$1,useClass:i,multi:!0}];var c=class e{runners=h$2(R$1);run(n){let r=this.runners.find(t=>t.languages.includes(n.language));return r?r.run(n):Promise.resolve({kind:`compile-error`,message:`\u0414\u043B\u044F \u044F\u0437\u044B\u043A\u0430 \xAB${n.language}\xBB \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D \u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C`,logs:[]})}static ɵfac=function(r){return new(r||e)};static ɵprov=_({token:e,factory:e.ɵfac,providedIn:`root`})};var u=`devshelf`;var M$1=class t{read(n){try{let e=globalThis.localStorage?.getItem(`${u}:${n}`);return e==null?void 0:JSON.parse(e)}catch{return}}write(n,e){try{globalThis.localStorage?.setItem(`${u}:${n}`,JSON.stringify(e))}catch{}}static ɵfac=function(e){return new(e||t)};static ɵprov=_({token:t,factory:t.ɵfac,providedIn:`root`})};var g={search:`M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.35-4.35`,sun:`M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.42 1.41M7.05 16.95l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z`,moon:`M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z`,check:`m5 12.5 4.5 4.5L19 7.5`,arrowLeft:`M19 12H5m6-6-6 6 6 6`,arrowRight:`M5 12h14m-6-6 6 6-6 6`,play:`M7 4.5v15l12-7.5-12-7.5Z`,reset:`M4 12a8 8 0 1 0 2.34-5.66M4 4v4h4`,bulb:`M9 18h6m-5 3h4m-2-18a6 6 0 0 0-3.6 10.8c.6.45.95 1.15.95 1.9V16h5.3v-.3c0-.75.35-1.45.95-1.9A6 6 0 0 0 12 3Z`,eye:`M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z`,book:`M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Zm0 15A2.5 2.5 0 0 0 6.5 23H20v-5`,code:`m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14`,menu:`M4 7h16M4 12h16M4 17h16`,close:`M6 6l12 12M18 6 6 18`,copy:`M9 9h10v12H9zM5 15H4V3h12v1`,question:`M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 18h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z`,clock:`M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z`,layers:`m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5`,flag:`M5 21V4m0 0h11l-2 4 2 4H5`};var f=class t{name=Ta.required();size=Ta(18);strokeWidth=Ta(1.8);path=Oe(()=>g[this.name()]);static ɵfac=function(e){return new(e||t)};static ɵcmp=Zu({type:t,selectors:[[`app-icon`]],hostAttrs:[`aria-hidden`,`true`,1,`inline-flex`,`shrink-0`],inputs:{name:[1,`name`],size:[1,`size`],strokeWidth:[1,`strokeWidth`]},decls:2,vars:4,consts:[[`viewBox`,`0 0 24 24`,`fill`,`none`,`stroke`,`currentColor`,`stroke-linecap`,`round`,`stroke-linejoin`,`round`]],template:function(e,o){e&1&&(Xp(),td(0,`svg`,0),Fm(1,`path`),nd()),e&2&&(ya(`width`,o.size())(`height`,o.size())(`stroke-width`,o.strokeWidth()),Rb(),ya(`d`,o.path()))},encapsulation:2})};var pe=(e,t)=>{let n=t[1]?.path??``;return h$2(hE).findTrack(n)!==void 0};var ge=(e,t)=>{let n=t[1]?.path??``,r=t[2]?.path??``;return h$2(hE).findLesson(n,r)!==void 0};var ve=(e,t)=>{let n=t[1]?.path??``;return h$2(f$1).find(n)!==void 0};var be=e=>h$2(hE).findTrack(e.paramMap.get(`trackId`)??``)?.title??`Трек`;var ke=e=>h$2(hE).findLesson(e.paramMap.get(`trackId`)??``,e.paramMap.get(`lessonId`)??``)?.lesson.title??`Урок`;var _e=e=>h$2(f$1).find(e.paramMap.get(`exerciseId`)??``)?.title??`Задача`;var Ee=e=>{let t=h$2(hE).findTrack(e.paramMap.get(`trackId`)??``);return t?`\u0412\u043E\u043F\u0440\u043E\u0441\u044B: ${t.title}`:`Вопросы`};var de=[{path:``,title:`Учебная платформа фронтенд-разработчика`,loadComponent:()=>import(`./chunk-Cbc2Of4p.js`).then(e=>e.HomePage)},{path:`tracks`,title:`Все треки`,loadComponent:()=>import(`./chunk-BtSWpsa1.js`).then(e=>e.CatalogPage)},{path:`tracks/:trackId`,canMatch:[pe],title:be,loadComponent:()=>import(`./chunk-wlrT_po2.js`).then(e=>e.TrackPage)},{path:`tracks/:trackId/:lessonId`,canMatch:[ge],title:ke,loadComponent:()=>import(`./chunk-PJ7j0v1M.js`).then(e=>e.LessonPage)},{path:`practice`,title:`Практика`,loadComponent:()=>import(`./chunk-Bg3AFPao.js`).then(e=>e.PracticePage)},{path:`practice/:exerciseId`,canMatch:[ve],title:_e,loadComponent:()=>import(`./chunk-CT0Cznhs.js`).then(e=>e.ExercisePage)},{path:`quiz`,title:`Вопросы для собеседования`,loadComponent:()=>import(`./chunk-DeEHVYb_.js`).then(e=>e.QuizListPage)},{path:`quiz/:trackId`,canMatch:[pe],title:Ee,loadComponent:()=>import(`./chunk-6LjEcF7I.js`).then(e=>e.QuizPage)},{path:`home`,redirectTo:``,pathMatch:`full`},{path:`**`,title:`Страница не найдена`,loadComponent:()=>import(`./chunk-r3h8Ecg7.js`).then(e=>e.NotFoundPage)}];var me=`DevShelf`;var F=class e extends ff{title=h$2(ov);updateTitle(t){let n=this.buildTitle(t);this.title.setTitle(n?`${n} \u2014 ${me}`:me)}static ɵfac=(()=>{let t;return function(r){return(t||(t=ag(e)))(r||e)}})();static ɵprov=_({token:e,factory:e.ɵfac})};var he={providers:[xI(),aT(),O_(de,H_(),P_({scrollPositionRestoration:`enabled`,anchorScrolling:`enabled`}),V_({skipInitialTransition:!0})),RC(xC()),{provide:ff,useClass:F},w()]};var Se=[`system`,`light`,`dark`];var fe=`theme`;var Ce=e=>Se.some(t=>t===e);var M=class e{document=h$2(W);storage=h$2(M$1);systemPrefersDark=V(this.queryPrefersDark());preference=V(this.readPreference());resolved=Oe(()=>{let t=this.preference();return t!==`system`?t:this.systemPrefersDark()?`dark`:`light`});constructor(){this.watchSystemTheme(),_s(()=>{this.document.documentElement.dataset.theme=this.resolved(),this.storage.write(fe,this.preference())})}toggle(){this.preference.set(this.resolved()===`dark`?`light`:`dark`)}readPreference(){let t=this.storage.read(fe);return Ce(t)?t:`system`}queryPrefersDark(){return this.document.defaultView?.matchMedia?.(`(prefers-color-scheme: dark)`).matches??!1}watchSystemTheme(){this.document.defaultView?.matchMedia?.(`(prefers-color-scheme: dark)`)?.addEventListener(`change`,n=>this.systemPrefersDark.set(n.matches))}static ɵfac=function(n){return new(n||e)};static ɵprov=_({token:e,factory:e.ɵfac,providedIn:`root`})};var xe=(e,t)=>t.url;function Te(e,t){if(e&1&&(ea(0,`a`,8),ZS(1),ed()),e&2){let n=t.$implicit;Lm(`routerLink`,n.url),Rb(),id(` `,n.label,` `)}}function De(e,t){if(e&1){let n=SS();ea(0,`a`,19),Ea(`click`,function(){jp(n);let u=CS(2);return Up(u.menuOpen.set(!1))}),ZS(1),ed()}if(e&2){let n=t.$implicit;Lm(`routerLink`,n.url),Rb(),id(` `,n.label,` `)}}function Ie(e,t){if(e&1&&(ea(0,`nav`,17),vS(1,De,2,2,`a`,18,xe),ed()),e&2){let n=CS();Rb(),ES(n.navItems)}}var we=[{label:`Треки`,url:`/tracks`,exact:!1},{label:`Практика`,url:`/practice`,exact:!1},{label:`Собеседование`,url:`/quiz`,exact:!1}];var A=class e{search=h$2(g$2);theme=h$2(M);navItems=we;menuOpen=V(!1);static ɵfac=function(n){return new(n||e)};static ɵcmp=Zu({type:e,selectors:[[`app-site-header`]],hostAttrs:[1,`sticky`,`top-0`,`z-30`,`block`,`border-b`,`border-line`,`bg-canvas/85`,`backdrop-blur-md`],decls:23,vars:6,consts:[[1,`mx-auto`,`flex`,`h-16`,`max-w-[1400px]`,`items-center`,`gap-4`,`px-4`,`sm:px-6`],[`routerLink`,`/`,1,`flex`,`items-center`,`gap-2.5`,3,`click`],[`aria-hidden`,`true`,1,`flex`,`h-7`,`items-end`,`gap-[3px]`],[1,`h-5`,`w-[6px]`,`rounded-[2px]`,`bg-[#E9B501]`],[1,`h-7`,`w-[6px]`,`rounded-[2px]`,`bg-[#3178C6]`],[1,`h-6`,`w-[6px]`,`rounded-[2px]`,`bg-[#D2193A]`],[1,`font-display`,`text-[17px]`,`font-semibold`,`tracking-tight`],[`aria-label`,`Основная навигация`,1,`ml-6`,`hidden`,`items-center`,`gap-1`,`md:flex`],[`routerLinkActive`,`!text-ink bg-sunken`,1,`rounded-lg`,`px-3`,`py-1.5`,`text-[15px]`,`text-muted`,`transition-colors`,`hover:text-ink`,3,`routerLink`],[1,`ml-auto`,`flex`,`items-center`,`gap-2`],[`type`,`button`,`aria-label`,`Открыть поиск`,1,`flex`,`h-9`,`items-center`,`gap-2`,`rounded-lg`,`border`,`border-line`,`bg-surface`,`px-3`,`text-sm`,`text-muted`,`transition-colors`,`hover:text-ink`,`sm:w-64`,3,`click`],[`name`,`search`,3,`size`],[1,`hidden`,`sm:inline`],[1,`ml-auto`,`hidden`,`rounded`,`border`,`border-line`,`px-1.5`,`text-[11px]`,`sm:inline`],[`type`,`button`,1,`flex`,`h-9`,`w-9`,`items-center`,`justify-center`,`rounded-lg`,`text-muted`,`transition-colors`,`hover:bg-sunken`,`hover:text-ink`,3,`click`],[3,`name`],[`type`,`button`,`aria-controls`,`mobile-nav`,`aria-label`,`Меню`,1,`flex`,`h-9`,`w-9`,`items-center`,`justify-center`,`rounded-lg`,`text-muted`,`hover:bg-sunken`,`hover:text-ink`,`md:hidden`,3,`click`],[`id`,`mobile-nav`,`aria-label`,`Мобильная навигация`,1,`border-t`,`border-line`,`px-4`,`py-2`,`md:hidden`],[`routerLinkActive`,`!text-ink`,1,`block`,`rounded-lg`,`px-2`,`py-2.5`,`text-muted`,3,`routerLink`],[`routerLinkActive`,`!text-ink`,1,`block`,`rounded-lg`,`px-2`,`py-2.5`,`text-muted`,3,`click`,`routerLink`]],template:function(n,r){n&1&&(ea(0,`div`,0)(1,`a`,1),Ea(`click`,function(){return r.menuOpen.set(!1)}),ea(2,`span`,2),va(3,`span`,3)(4,`span`,4)(5,`span`,5),ed(),ea(6,`span`,6),ZS(7,`DevShelf`),ed()(),ea(8,`nav`,7),vS(9,Te,2,2,`a`,8,xe),ed(),ea(11,`div`,9)(12,`button`,10),Ea(`click`,function(){return r.search.open()}),va(13,`app-icon`,11),ea(14,`span`,12),ZS(15,`Поиск по урокам`),ed(),ea(16,`kbd`,13),ZS(17,`Ctrl K`),ed()(),ea(18,`button`,14),Ea(`click`,function(){return r.theme.toggle()}),va(19,`app-icon`,15),ed(),ea(20,`button`,16),Ea(`click`,function(){return r.menuOpen.update(c=>!c)}),va(21,`app-icon`,15),ed()()(),pS(22,Ie,3,0,`nav`,17)),n&2&&(Rb(9),ES(r.navItems),Rb(4),Lm(`size`,16),Rb(5),ya(`aria-label`,r.theme.resolved()===`dark`?`Включить светлую тему`:`Включить тёмную тему`),Rb(),Lm(`name`,r.theme.resolved()===`dark`?`sun`:`moon`),Rb(),ya(`aria-expanded`,r.menuOpen()),Rb(),Lm(`name`,r.menuOpen()?`close`:`menu`),Rb(),gS(r.menuOpen()?22:-1))},dependencies:[fc,R_,f],encapsulation:2})};var Fe=[`dialog`];var Pe=[`input`];var Me=(e,t)=>t.url;function Ae(e,t){if(e&1){let n=SS();ea(0,`li`,10),Ea(`mouseenter`,function(){let u=jp(n).$index,c=CS();return Up(c.activeIndex.set(u))})(`click`,function(){let u=jp(n).$implicit,c=CS();return Up(c.go(u))}),va(1,`span`,11),ea(2,`span`,12)(3,`span`,13),ZS(4),ed(),ea(5,`span`,14),ZS(6),ed()(),ea(7,`span`,15),ZS(8),ed()()}if(e&2){let n=t.$implicit,r=t.$index,u=CS();Gm(`bg-sunken`,r===u.activeIndex()),Lm(`id`,`search-hit-`+r),ya(`aria-selected`,r===u.activeIndex()),Rb(),qm(`background`,n.accent),Rb(3),Jm(n.title),Rb(2),Jm(n.context),Rb(2),Jm(u.kindLabels[n.kind])}}function Le(e,t){e&1&&(ea(0,`li`,9),ZS(1,` Ничего не нашлось. Попробуйте другое слово — например, название оператора или хука. `),ed())}var Re={track:`Трек`,lesson:`Урок`,exercise:`Задача`};var L=class e{search=h$2(g$2);router=h$2(er);dialog=JU.required(`dialog`);input=JU.required(`input`);kindLabels=Re;activeIndex=V(0);activeId=()=>`search-hit-${this.activeIndex()}`;constructor(){_s(()=>this.syncDialog(this.search.isOpen()))}onGlobalKeydown(t){(t.metaKey||t.ctrlKey)&&t.key.toLowerCase()===`k`&&(t.preventDefault(),this.search.isOpen()?this.search.close():this.search.open(),this.syncDialog(this.search.isOpen()))}syncDialog(t){let n=this.dialog().nativeElement;t&&!n.open?(this.activeIndex.set(0),n.showModal(),this.input().nativeElement.focus()):!t&&n.open&&n.close()}onInput(t){t.target instanceof HTMLInputElement&&(this.search.query.set(t.target.value),this.activeIndex.set(0))}onListKeydown(t){let n=this.search.hits().length;if(n!==0){if(t.key===`ArrowDown`)t.preventDefault(),this.activeIndex.update(r=>(r+1)%n);else if(t.key===`ArrowUp`)t.preventDefault(),this.activeIndex.update(r=>(r-1+n)%n);else if(t.key===`Enter`){let r=this.search.hits()[this.activeIndex()];r&&this.go(r)}}}closeOnBackdrop(t){t.target===this.dialog().nativeElement&&this.search.close()}go(t){this.search.close(),this.router.navigateByUrl(t.url)}static ɵfac=function(n){return new(n||e)};static ɵcmp=Zu({type:e,selectors:[[`app-search-palette`]],viewQuery:function(n,r){n&1&&Bm(r.dialog,Fe,5)(r.input,Pe,5),n&2&&MS(2)},hostBindings:function(n,r){n&1&&Ea(`keydown`,function(c){return r.onGlobalKeydown(c)},Gw)},decls:12,vars:3,consts:[[`dialog`,``],[`input`,``],[`aria-label`,`Поиск по платформе`,1,`m-auto`,`mt-[10vh]`,`w-[min(640px,calc(100vw-32px))]`,`rounded-2xl`,`border`,`border-line`,`bg-surface`,`p-0`,`text-ink`,`shadow-2xl`,`backdrop:bg-black/45`,`backdrop:backdrop-blur-[2px]`,3,`close`,`click`],[1,`flex`,`items-center`,`gap-3`,`border-b`,`border-line`,`px-4`],[`name`,`search`,1,`text-muted`],[`type`,`search`,`placeholder`,`Урок, тема или оператор: switchMap, DI, XSS…`,`autocomplete`,`off`,`role`,`combobox`,`aria-controls`,`search-results`,`aria-expanded`,`true`,1,`h-14`,`w-full`,`bg-transparent`,`text-base`,`outline-none`,`placeholder:text-muted`,3,`input`,`keydown`,`value`],[1,`hidden`,`rounded`,`border`,`border-line`,`px-1.5`,`py-0.5`,`text-xs`,`text-muted`,`sm:block`],[`id`,`search-results`,`role`,`listbox`,1,`max-h-[60vh]`,`overflow-y-auto`,`p-2`],[`role`,`option`,1,`flex`,`cursor-pointer`,`items-center`,`gap-3`,`rounded-xl`,`px-3`,`py-2.5`,3,`id`,`bg-sunken`],[1,`px-3`,`py-8`,`text-center`,`text-muted`],[`role`,`option`,1,`flex`,`cursor-pointer`,`items-center`,`gap-3`,`rounded-xl`,`px-3`,`py-2.5`,3,`mouseenter`,`click`,`id`],[1,`h-8`,`w-1.5`,`shrink-0`,`rounded-full`],[1,`min-w-0`,`flex-1`],[1,`block`,`truncate`,`font-medium`],[1,`block`,`truncate`,`text-sm`,`text-muted`],[1,`text-xs`,`text-muted`]],template:function(n,r){n&1&&(ea(0,`dialog`,2,0),Ea(`close`,function(){return r.search.close()})(`click`,function(c){return r.closeOnBackdrop(c)}),ea(2,`div`,3),va(3,`app-icon`,4),ea(4,`input`,5,1),Ea(`input`,function(c){return r.onInput(c)})(`keydown`,function(c){return r.onListKeydown(c)}),ed(),ea(6,`kbd`,6),ZS(7,`Esc`),ed()(),ea(8,`ul`,7),vS(9,Ae,9,9,`li`,8,Me,!1,Le,2,0,`li`,9),ed()()),n&2&&(Rb(4),Lm(`value`,r.search.query()),ya(`aria-activedescendant`,r.activeId()),Rb(5),ES(r.search.hits()))},dependencies:[f],encapsulation:2})};var R=class e{static ɵfac=function(n){return new(n||e)};static ɵcmp=Zu({type:e,selectors:[[`app-root`]],hostAttrs:[1,`flex`,`min-h-dvh`,`flex-col`],decls:12,vars:0,consts:[[`href`,`#main`,1,`sr-only`,`focus:not-sr-only`,`focus:fixed`,`focus:top-2`,`focus:left-2`,`focus:z-50`,`focus:rounded-lg`,`focus:bg-surface`,`focus:px-3`,`focus:py-2`],[`id`,`main`,1,`flex-1`],[1,`border-t`,`border-line`],[1,`mx-auto`,`flex`,`max-w-[1400px]`,`flex-wrap`,`items-center`,`gap-x-6`,`gap-y-2`,`px-4`,`py-6`,`text-sm`,`text-muted`,`sm:px-6`],[1,`sm:ml-auto`]],template:function(n,r){n&1&&(ea(0,`a`,0),ZS(1,` Перейти к содержимому `),ed(),va(2,`app-site-header`),ea(3,`main`,1),va(4,`router-outlet`),ed(),ea(5,`footer`,2)(6,`div`,3)(7,`span`),ZS(8,`DevShelf — теория и практика для фронтенд-разработчика`),ed(),ea(9,`span`,4),ZS(10,`Прогресс хранится в этом браузере`),ed()()(),va(11,`app-search-palette`))},dependencies:[cf,A,L],encapsulation:2})};iC(R,he).catch(e=>console.error(e));export{f$1 as a,g$2 as i,f as n,c as r,M$1 as t};