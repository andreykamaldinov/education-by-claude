import type { Exercise } from '../../domain/exercise.model';

/** Exercises for OOP/SOLID, design patterns and architecture tracks. */
export const DESIGN_EXERCISES = [
  {
    id: 'oop-bank-account',
    trackId: 'oop-solid',
    title: 'Инкапсуляция: банковский счёт',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'oop-principles',
    description: `Реализуйте класс \`BankAccount\`, который защищает свои инварианты:

- баланс хранится в **настоящем** приватном поле (\`#balance\`) и доступен только через геттер \`balance\`;
- \`deposit(amount)\` и \`withdraw(amount)\` принимают только положительные конечные числа, иначе бросают \`RangeError\`;
- \`withdraw\` при недостатке средств бросает ошибку с текстом \`Недостаточно средств\`, баланс не меняется;
- \`history\` возвращает **копию** списка операций \`{ type: 'deposit' | 'withdraw', amount }\` — изменение копии не влияет на счёт.`,
    starter: `type Operation = { type: 'deposit' | 'withdraw'; amount: number };

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
`,
    solution: `type Operation = { type: 'deposit' | 'withdraw'; amount: number };

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
    if (amount > this.#balance) throw new Error('Недостаточно средств');
    this.#balance -= amount;
    this.#operations.push({ type: 'withdraw', amount });
  }

  #assertAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) throw new RangeError('Сумма должна быть положительной');
  }
}
`,
    tests: [
      { name: 'пополнение и списание', code: `const acc = new BankAccount();
acc.deposit(100);
acc.withdraw(30);
expect(acc.balance).toBe(70);` },
      { name: 'нельзя уйти в минус', code: `const acc = new BankAccount();
acc.deposit(10);
expect(() => acc.withdraw(50)).toThrow('Недостаточно средств');
expect(acc.balance).toBe(10);` },
      { name: 'некорректные суммы', code: `const acc = new BankAccount();
expect(() => acc.deposit(-5)).toThrow();
expect(() => acc.deposit(0)).toThrow();
expect(() => acc.deposit(Infinity)).toThrow();
expect(() => acc.deposit(NaN)).toThrow();` },
      { name: 'баланс нельзя переписать снаружи', code: `const acc = new BankAccount();
acc.deposit(5);
try { acc.balance = 1000000; } catch {}
expect(acc.balance).toBe(5);
expect(Object.keys(acc)).toEqual([]);` },
      { name: 'history — копия', code: `const acc = new BankAccount();
acc.deposit(5);
acc.history.push({ type: 'deposit', amount: 999 });
acc.history[0].amount = 1;
expect(acc.history).toEqual([{ type: 'deposit', amount: 5 }]);` },
    ],
    hints: ['Поля #balance не видны в Object.keys и недоступны снаружи.', 'Для history верните map с копированием объектов.'],
  },
  {
    id: 'pat-strategy-shipping',
    trackId: 'patterns',
    title: 'Strategy: расчёт доставки',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'strategy',
    description: `Интернет-магазин считает доставку по-разному. Вместо \`switch\` реализуйте стратегии и калькулятор:

- \`courier\`: 300 ₽, бесплатно от суммы заказа 5000 ₽;
- \`pickup\`: всегда 0;
- \`post\`: 200 ₽ + 50 ₽ за каждый полный или неполный килограмм веса.

\`createShippingCalculator(strategies)\` возвращает объект с методом \`cost(method, order)\`, где \`order = { total, weightKg }\`. Для неизвестного способа — ошибка \`Неизвестный способ доставки\`. Новые способы должны добавляться **без изменения** калькулятора (OCP).`,
    starter: `type Order = { total: number; weightKg: number };
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
`,
    solution: `type Order = { total: number; weightKg: number };
type ShippingStrategy = { id: string; cost(order: Order): number };

const courier: ShippingStrategy = { id: 'courier', cost: (order) => (order.total >= 5000 ? 0 : 300) };
const pickup: ShippingStrategy = { id: 'pickup', cost: () => 0 };
const post: ShippingStrategy = { id: 'post', cost: (order) => 200 + 50 * Math.ceil(order.weightKg) };

function createShippingCalculator(strategies: ShippingStrategy[]) {
  const byId = new Map(strategies.map((strategy) => [strategy.id, strategy]));
  return {
    cost(method: string, order: Order): number {
      const strategy = byId.get(method);
      if (!strategy) throw new Error('Неизвестный способ доставки: ' + method);
      return strategy.cost(order);
    },
  };
}
`,
    tests: [
      { name: 'курьер', code: `const calc = createShippingCalculator([courier, pickup, post]);
expect(calc.cost('courier', { total: 1000, weightKg: 1 })).toBe(300);
expect(calc.cost('courier', { total: 5000, weightKg: 1 })).toBe(0);` },
      { name: 'почта и самовывоз', code: `const calc = createShippingCalculator([courier, pickup, post]);
expect(calc.cost('post', { total: 100, weightKg: 2.1 })).toBe(350);
expect(calc.cost('pickup', { total: 1, weightKg: 100 })).toBe(0);` },
      { name: 'расширение без изменения калькулятора', code: `const drone = { id: 'drone', cost: (o) => (o.weightKg <= 2 ? 990 : Infinity) };
const calc = createShippingCalculator([courier, drone]);
expect(calc.cost('drone', { total: 1, weightKg: 1 })).toBe(990);` },
      { name: 'неизвестный способ', code: `expect(() => createShippingCalculator([pickup]).cost('teleport', { total: 1, weightKg: 1 })).toThrow('Неизвестный способ доставки');` },
    ],
    hints: ['Стратегия — объект с методом cost.', 'Калькулятор строит Map по id и делегирует расчёт найденной стратегии.'],
  },
  {
    id: 'pat-middleware-chain',
    trackId: 'patterns',
    title: 'Chain of Responsibility: цепочка middleware',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'chain-of-responsibility',
    description: `Реализуйте \`compose(middlewares, handler)\` — то, как устроены интерсепторы Angular и middleware в Express:

~~~ts
type Middleware = (req: Req, next: (req: Req) => Res) => Res;
~~~

- middleware вызываются в порядке массива, каждый получает \`next\`, вызывающий следующий;
- последний \`next\` вызывает \`handler\`;
- middleware может изменить запрос, обработать ответ на обратном пути или **не вызывать** \`next\` и ответить сам.`,
    starter: `type Req = { url: string; headers: Record<string, string> };
type Res = { status: number; body: string };
type Middleware = (req: Req, next: (req: Req) => Res) => Res;

function compose(middlewares: Middleware[], handler: (req: Req) => Res): (req: Req) => Res {
  return handler;
}
`,
    solution: `type Req = { url: string; headers: Record<string, string> };
type Res = { status: number; body: string };
type Middleware = (req: Req, next: (req: Req) => Res) => Res;

function compose(middlewares: Middleware[], handler: (req: Req) => Res): (req: Req) => Res {
  return middlewares.reduceRight<(req: Req) => Res>((next, middleware) => (req) => middleware(req, next), handler);
}
`,
    tests: [
      { name: 'порядок вызова туда и обратно', code: `const log = [];
const a = (req, next) => { log.push('a>'); const res = next(req); log.push('<a'); return res; };
const b = (req, next) => { log.push('b>'); const res = next(req); log.push('<b'); return res; };
compose([a, b], () => { log.push('handler'); return { status: 200, body: '' }; })({ url: '/', headers: {} });
expect(log).toEqual(['a>', 'b>', 'handler', '<b', '<a']);` },
      { name: 'изменение запроса и ответа', code: `const auth = (req, next) => next({ ...req, headers: { ...req.headers, auth: 'token' } });
const upper = (req, next) => { const res = next(req); return { ...res, body: res.body.toUpperCase() }; };
const run = compose([auth, upper], (req) => ({ status: 200, body: 'auth=' + req.headers.auth }));
expect(run({ url: '/', headers: {} })).toEqual({ status: 200, body: 'AUTH=TOKEN' });` },
      { name: 'досрочный ответ без next', code: `const handler = spy(() => ({ status: 200, body: 'fresh' }));
const cache = (req, next) => (req.url === '/cached' ? { status: 200, body: 'cache' } : next(req));
const run = compose([cache], handler);
expect(run({ url: '/cached', headers: {} }).body).toBe('cache');
expect(handler.calls).toHaveLength(0);` },
      { name: 'пустая цепочка', code: `const run = compose([], () => ({ status: 204, body: '' }));
expect(run({ url: '/', headers: {} }).status).toBe(204);` },
    ],
    hints: ['Соберите цепочку с конца: reduceRight, начальное значение — handler.'],
  },
  {
    id: 'pat-query-builder',
    trackId: 'patterns',
    title: 'Builder: иммутабельный конструктор запроса',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'builder',
    description: `Сделайте **иммутабельный** builder параметров запроса к API (как \`HttpParams\` в Angular): каждый метод возвращает **новый** объект, исходный не меняется.

~~~ts
const base = QueryBuilder.create().filter('status', 'active');
const page1 = base.page(1, 20).build();
const page2 = base.page(2, 20).sort('name', 'desc').build();
// base по-прежнему без страницы
~~~

\`build()\` возвращает строку: фильтры \`filter[field]=value\` в порядке добавления, затем \`page\`, \`size\`, затем \`sort=field,dir\`. Значения кодируются \`encodeURIComponent\`. Размер страницы должен быть от 1 до 100, иначе \`RangeError\`.`,
    starter: `class QueryBuilder {
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
`,
    solution: `type QueryState = {
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
    if (size < 1 || size > 100) throw new RangeError('Размер страницы от 1 до 100');
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
`,
    tests: [
      { name: 'полная сборка', code: `expect(QueryBuilder.create().filter('status', 'active').page(2, 20).sort('name', 'desc').build())
  .toBe('filter[status]=active&page=2&size=20&sort=name,desc');` },
      { name: 'иммутабельность', code: `const base = QueryBuilder.create().filter('city', 'Казань');
const withPage = base.page(1, 10);
expect(base.build()).toBe('filter[city]=%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C');
expect(withPage).not.toBe(base);
expect(withPage.build()).toContain('page=1');` },
      { name: 'валидация размера', code: `expect(() => QueryBuilder.create().page(1, 0)).toThrow();
expect(() => QueryBuilder.create().page(1, 500)).toThrow();` },
      { name: 'пустой запрос', code: `expect(QueryBuilder.create().build()).toBe('');` },
    ],
    hints: ['Храните состояние в неизменяемом объекте и создавайте новый builder в каждом методе.'],
  },
  {
    id: 'arch-dto-mapper',
    trackId: 'architecture',
    title: 'Adapter: маппер DTO на границе',
    level: 'basic',
    language: 'typescript',
    relatedLessonId: 'layered-clean',
    description: `API отдаёт заказы в своём формате. Напишите адаптер \`toOrder(dto)\`, чтобы формат бэкенда не протекал в приложение:

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
  total: number; // в рублях
  customerName: string; // 'Без имени', если нет
};
~~~

Неизвестный \`status_code\` — ошибка \`Неизвестный статус\`.`,
    starter: `type OrderDto = {
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
  throw new Error('не реализовано');
}
`,
    solution: `type OrderDto = {
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
  if (!status) throw new Error('Неизвестный статус: ' + dto.status_code);
  const cents = dto.items.reduce((sum, item) => sum + item.price_cents * item.qty, 0);
  return {
    id: String(dto.order_id),
    createdAt: new Date(dto.created_at),
    status,
    total: cents / 100,
    customerName: dto.customer?.full_name?.trim() || 'Без имени',
  };
}
`,
    tests: [
      { name: 'полный маппинг', code: `const order = toOrder({
  order_id: 42, created_at: '2026-10-29T10:00:00Z', status_code: 'P',
  items: [{ sku: 'a', price_cents: 1050, qty: 2 }, { sku: 'b', price_cents: 99, qty: 1 }],
  customer: { full_name: ' Анна Петрова ' },
});
expect(order.id).toBe('42');
expect(order.status).toBe('paid');
expect(order.total).toBe(21.99);
expect(order.customerName).toBe('Анна Петрова');
expect(order.createdAt).toBeInstanceOf(Date);
expect(order.createdAt.toISOString()).toBe('2026-10-29T10:00:00.000Z');` },
      { name: 'нет покупателя', code: `const base = { order_id: 1, created_at: '2026-01-01T00:00:00Z', status_code: 'N', items: [] };
expect(toOrder(base).customerName).toBe('Без имени');
expect(toOrder({ ...base, customer: null }).customerName).toBe('Без имени');
expect(toOrder({ ...base, customer: { full_name: '  ' } }).customerName).toBe('Без имени');` },
      { name: 'неизвестный статус', code: `expect(() => toOrder({ order_id: 1, created_at: '2026-01-01', status_code: 'X', items: [] })).toThrow('Неизвестный статус');` },
    ],
    hints: ['Таблица соответствия кодов статусов — Record.', 'Сумму считайте в копейках и делите на 100 в конце.'],
  },
  {
    id: 'arch-circuit-breaker',
    trackId: 'architecture',
    title: 'Circuit Breaker',
    level: 'advanced',
    language: 'typescript',
    relatedLessonId: 'microservice-patterns',
    description: `Реализуйте \`CircuitBreaker\` вокруг асинхронной операции. Время берётся из переданной функции \`now()\` — так поведение легко тестировать.

~~~ts
const breaker = new CircuitBreaker(callApi, { failureThreshold: 3, resetTimeoutMs: 1000, now: () => Date.now() });
await breaker.call(args);
breaker.state; // 'closed' | 'open' | 'half-open'
~~~

- **closed**: вызовы проходят; после \`failureThreshold\` ошибок **подряд** → \`open\`; успех сбрасывает счётчик;
- **open**: вызовы сразу отклоняются ошибкой \`Circuit is open\` без обращения к операции; по истечении \`resetTimeoutMs\` следующий вызов переводит в \`half-open\`;
- **half-open**: один пробный вызов; успех → \`closed\`, ошибка → снова \`open\` (таймер заново).`,
    starter: `type State = 'closed' | 'open' | 'half-open';

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
`,
    solution: `type State = 'closed' | 'open' | 'half-open';

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
`,
    tests: [
      { name: 'размыкается после порога ошибок', code: `let time = 0;
const op = spy(async () => { throw new Error('500'); });
const breaker = new CircuitBreaker(op, { failureThreshold: 3, resetTimeoutMs: 1000, now: () => time });
for (let i = 0; i < 3; i++) { try { await breaker.call(); } catch {} }
expect(breaker.state).toBe('open');
let message = '';
try { await breaker.call(); } catch (e) { message = e.message; }
expect(message).toBe('Circuit is open');
expect(op.calls).toHaveLength(3);` },
      { name: 'успех сбрасывает счётчик', code: `let fail = true;
const breaker = new CircuitBreaker(async () => { if (fail) throw new Error('x'); return 'ok'; }, { failureThreshold: 2, resetTimeoutMs: 100, now: () => 0 });
try { await breaker.call(); } catch {}
fail = false;
await breaker.call();
fail = true;
try { await breaker.call(); } catch {}
expect(breaker.state).toBe('closed');` },
      { name: 'half-open → closed после успеха', code: `let time = 0;
let fail = true;
const breaker = new CircuitBreaker(async () => { if (fail) throw new Error('x'); return 'ok'; }, { failureThreshold: 1, resetTimeoutMs: 500, now: () => time });
try { await breaker.call(); } catch {}
expect(breaker.state).toBe('open');
time = 600;
fail = false;
expect(await breaker.call()).toBe('ok');
expect(breaker.state).toBe('closed');` },
      { name: 'half-open → open после ошибки', code: `let time = 0;
const breaker = new CircuitBreaker(async () => { throw new Error('x'); }, { failureThreshold: 1, resetTimeoutMs: 500, now: () => time });
try { await breaker.call(); } catch {}
time = 600;
try { await breaker.call(); } catch {}
expect(breaker.state).toBe('open');
time = 900;
let message = '';
try { await breaker.call(); } catch (e) { message = e.message; }
expect(message).toBe('Circuit is open');` },
    ],
    hints: ['Храните число ошибок подряд и момент размыкания.', 'В состоянии open проверяйте, прошло ли resetTimeoutMs, прежде чем пробовать.'],
  },
  {
    id: 'arch-idempotency',
    trackId: 'architecture',
    title: 'Идемпотентный обработчик',
    level: 'middle',
    language: 'typescript',
    relatedLessonId: 'event-driven',
    description: `Брокер доставляет сообщения **хотя бы один раз** — дубли возможны. Напишите \`idempotent(handler)\`: обёртку над асинхронным обработчиком сообщений \`{ id, payload }\`, которая:

- для повторного сообщения с тем же \`id\` не вызывает \`handler\` и возвращает сохранённый результат;
- если дубль пришёл, пока первый ещё обрабатывается, — ждёт тот же результат (не запускает обработку дважды);
- если обработка упала, результат не сохраняется — повтор с тем же \`id\` можно выполнить снова.`,
    starter: `type Message<T> = { id: string; payload: T };

function idempotent<T, R>(handler: (message: Message<T>) => Promise<R>): (message: Message<T>) => Promise<R> {
  return handler;
}
`,
    solution: `type Message<T> = { id: string; payload: T };

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
`,
    tests: [
      { name: 'дубль не обрабатывается повторно', code: `const handler = spy(async (m) => 'списано ' + m.payload);
const safe = idempotent(handler);
expect(await safe({ id: 'pay-1', payload: 100 })).toBe('списано 100');
expect(await safe({ id: 'pay-1', payload: 100 })).toBe('списано 100');
expect(handler.calls).toHaveLength(1);` },
      { name: 'параллельный дубль ждёт тот же результат', code: `const handler = spy((m) => new Promise((r) => setTimeout(() => r(m.id), 20)));
const safe = idempotent(handler);
const [a, b] = await Promise.all([safe({ id: 'x', payload: 1 }), safe({ id: 'x', payload: 1 })]);
expect(a).toBe('x');
expect(b).toBe('x');
expect(handler.calls).toHaveLength(1);` },
      { name: 'после ошибки можно повторить', code: `let attempt = 0;
const safe = idempotent(async () => { attempt++; if (attempt === 1) throw new Error('сбой'); return 'ok'; });
try { await safe({ id: 'm', payload: null }); } catch {}
expect(await safe({ id: 'm', payload: null })).toBe('ok');
expect(attempt).toBe(2);` },
      { name: 'разные id обрабатываются независимо', code: `const handler = spy(async (m) => m.id);
const safe = idempotent(handler);
await safe({ id: 'a', payload: 0 });
await safe({ id: 'b', payload: 0 });
expect(handler.calls).toHaveLength(2);` },
    ],
    hints: ['Храните промис результата по id сразу, до завершения — тогда параллельный дубль получит тот же промис.', 'В catch удаляйте запись, чтобы ошибка не закешировалась.'],
  },
] as const satisfies readonly Exercise[];
