**Proxy** (заместитель) — объект с тем же интерфейсом, что и реальный, который **контролирует доступ** к нему: откладывает создание, кеширует, проверяет права, логирует или отправляет запросы по сети.

## Отличие от Decorator

Структурно Proxy и Decorator похожи: оба оборачивают объект с тем же интерфейсом. Разница — в намерении:

- **Decorator** добавляет новые обязанности, обёртки свободно комбинируются клиентом.
- **Proxy** управляет доступом к объекту и часто сам управляет его жизненным циклом (создаёт лениво, решает, пускать ли вызов дальше).

## Виды заместителей

### Виртуальный (ленивая инициализация)

```ts
type PdfRenderer = { render(doc: Document): Promise<Blob> };

class LazyPdfRenderer implements PdfRenderer {
  #real?: Promise<PdfRenderer>;

  render(doc: Document) {
    // тяжёлая библиотека грузится только при первом вызове
    this.#real ??= import('./heavy-pdf-renderer').then((m) => new m.HeavyPdfRenderer());
    return this.#real.then((renderer) => renderer.render(doc));
  }
}
```

Ленивые маршруты и `@defer` в Angular — тот же принцип на уровне фреймворка: заглушка (placeholder) стоит на месте настоящего компонента, пока он не понадобится.

### Кеширующий

```ts
class CachingWeatherApi implements WeatherApi {
  readonly #cache = new Map<string, { value: Forecast; expiresAt: number }>();

  constructor(
    private readonly real: WeatherApi,
    private readonly ttlMs = 10 * 60_000,
  ) {}

  async forecast(city: string) {
    const cached = this.#cache.get(city);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const value = await this.real.forecast(city);
    this.#cache.set(city, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }
}
```

### Защищающий (контроль доступа)

```ts
class GuardedAdminApi implements AdminApi {
  constructor(
    private readonly real: AdminApi,
    private readonly auth: PermissionChecker,
  ) {}

  deleteUser(id: string) {
    if (!this.auth.can('users:delete')) {
      return Promise.reject(new ForbiddenError('Нет прав на удаление'));
    }
    return this.real.deleteUser(id);
  }
}
```

(Напомним: на клиенте это UX, а не безопасность — права проверяет сервер.)

### Удалённый (remote proxy)

Объект, который выглядит локальным, но перенаправляет вызовы по сети или в другой поток:

```ts
// Comlink: воркер выглядит как обычный объект
const api = wrap<ReportWorkerApi>(new Worker(new URL('./report.worker', import.meta.url), { type: 'module' }));
const report = await api.aggregate(rows); // на самом деле — postMessage в другой поток
```

Сгенерированные клиенты OpenAPI/gRPC — тоже удалённые заместители: вызов метода превращается в HTTP-запрос.

## ES Proxy

JavaScript имеет встроенный объект `Proxy`, позволяющий реализовать паттерн для **любых** операций с объектом:

```ts
function readonlyView<T extends object>(target: T): Readonly<T> {
  return new Proxy(target, {
    set() {
      throw new TypeError('Объект доступен только для чтения');
    },
    deleteProperty() {
      throw new TypeError('Объект доступен только для чтения');
    },
  });
}

function withAccessLog<T extends object>(target: T, log: (key: PropertyKey) => void): T {
  return new Proxy(target, {
    get(obj, key, receiver) {
      log(key);
      return Reflect.get(obj, key, receiver);
    },
  });
}
```

Подробно — урок [Proxy, Reflect и Symbol](/tracks/javascript/proxy-reflect).

## В Angular

- **Ленивые маршруты и `@defer`** — виртуальный заместитель для кода.
- **`HttpClient` + интерсептор кеша** — кеширующий заместитель для данных.
- **`ngSkipHydration`, плейсхолдеры** — заместитель вместо настоящего содержимого.
- **Сервис-обёртка над `localStorage`** с `try/catch` и in-memory fallback — заместитель, контролирующий доступ к ненадёжному ресурсу (так сделано на этой платформе).

> [!INTERVIEW]
> «Чем Proxy отличается от Decorator?» — Структура одинаковая: обёртка с тем же интерфейсом, что и реальный объект. Decorator добавляет поведение и рассчитан на свободное комбинирование. Proxy контролирует доступ: ленивое создание, кеш, проверку прав, удалённый вызов — и часто управляет жизненным циклом реального объекта, который клиент даже не видит.

## Коротко

- Proxy — заместитель с тем же интерфейсом, контролирующий доступ.
- Виды: виртуальный (ленивый), кеширующий, защищающий, удалённый.
- Ленивые маршруты, `@defer`, Comlink, клиенты API — примеры заместителей.
- ES `Proxy` позволяет перехватывать любые операции с объектом.
- От Decorator отличается намерением, а не структурой.
