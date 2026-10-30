**Decorator** (структурный паттерн) динамически добавляет объекту поведение, оборачивая его в объект с **тем же интерфейсом**. Обёртки можно вкладывать друг в друга, комбинируя возможности без взрыва подклассов.

> [!NOTE]
> Не путайте паттерн Decorator с декораторами TypeScript (`@Component`). Синтаксис `@` — механизм языка для метаданных и модификации классов. Паттерн — способ композиции объектов. Связь есть (декоратор метода может реализовать паттерн), но это разные понятия.

## Структура

```ts
type DataSource = {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
};

class HttpDataSource implements DataSource {
  async read(key: string) { /* fetch */ return null; }
  async write(key: string, value: string) { /* fetch */ }
}

// Декоратор: тот же интерфейс + делегирование вложенному объекту
class CachedDataSource implements DataSource {
  readonly #cache = new Map<string, string | null>();

  constructor(private readonly inner: DataSource) {}

  async read(key: string) {
    if (!this.#cache.has(key)) this.#cache.set(key, await this.inner.read(key));
    return this.#cache.get(key) ?? null;
  }

  async write(key: string, value: string) {
    await this.inner.write(key, value);
    this.#cache.set(key, value);
  }
}

class LoggingDataSource implements DataSource {
  constructor(
    private readonly inner: DataSource,
    private readonly log: (msg: string) => void,
  ) {}

  async read(key: string) {
    const started = performance.now();
    const value = await this.inner.read(key);
    this.log(`read ${key}: ${Math.round(performance.now() - started)} мс`);
    return value;
  }

  write(key: string, value: string) {
    this.log(`write ${key}`);
    return this.inner.write(key, value);
  }
}

// Комбинируем как матрёшку
const source: DataSource = new LoggingDataSource(new CachedDataSource(new HttpDataSource()), console.info);
```

Клиент работает с `DataSource` и не знает, сколько обёрток внутри. Наследованием пришлось бы создавать `CachedLoggingHttpDataSource`, `LoggingHttpDataSource`, `CachedHttpDataSource`…

## Функциональный декоратор

В JavaScript функции — объекты первого класса, поэтому декоратор часто — функция высшего порядка:

```ts
const withRetry =
  <A extends unknown[], R>(fn: (...args: A) => Promise<R>, attempts = 3) =>
  async (...args: A): Promise<R> => {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  };

const withTiming =
  <A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) =>
  async (...args: A) => {
    const start = performance.now();
    try {
      return await fn(...args);
    } finally {
      console.info(`${name}: ${performance.now() - start} мс`);
    }
  };

const loadUser = withTiming('loadUser', withRetry(fetchUser, 3));
```

`debounce`, `memoize`, `throttle` — тоже декораторы функций.

## Декораторы в Angular и RxJS

### Интерсепторы HttpClient

Каждый интерсептор оборачивает «следующий обработчик» с тем же контрактом `(req) => Observable<HttpEvent>` и добавляет поведение: токен, повторы, логирование, кеш. Цепочка интерсепторов — одновременно Decorator и [Chain of Responsibility](/tracks/patterns/chain-of-responsibility).

### Операторы RxJS

Каждый оператор принимает Observable и возвращает Observable с дополнительным поведением — классический декоратор:

```ts
const resilientPrices$ = prices$.pipe(
  retry({ count: 3, delay: 1000 }), // + повторы
  shareReplay({ bufferSize: 1, refCount: true }), // + общий кеш
  timeout(10_000), // + таймаут
);
```

### Декорирование провайдера

```ts
providers: [
  HttpProductApi,
  {
    provide: ProductApi,
    useFactory: () => new CachedProductApi(inject(HttpProductApi)), // обёртка вокруг реальной реализации
  },
];
```

### hostDirectives

Добавляют поведение компоненту без изменения его кода — декорирование на уровне элемента.

## Когда использовать

- Нужно добавлять независимые возможности (кеш, логирование, повторы, метрики, авторизацию) в разных комбинациях.
- Нельзя или нежелательно менять исходный класс (сторонняя библиотека).
- Поведение должно включаться конфигурацией (кеш — только в production).

> [!INTERVIEW]
> «Где в Angular применяется паттерн Decorator?» — HTTP-интерсепторы оборачивают обработку запроса с тем же контрактом и добавляют токены, повторы, кеш. Операторы RxJS оборачивают Observable, добавляя поведение. Провайдер через `useFactory` может обернуть настоящую реализацию сервиса кеширующей или логирующей обёрткой. Важно не путать паттерн с синтаксисом декораторов TypeScript вроде `@Component`.

## Коротко

- Decorator оборачивает объект с тем же интерфейсом и добавляет поведение.
- Обёртки комбинируются вложением — без взрыва подклассов.
- Функции высшего порядка — функциональные декораторы (`withRetry`, `debounce`).
- Интерсепторы и операторы RxJS — декораторы.
- Паттерн ≠ синтаксис `@` в TypeScript.
