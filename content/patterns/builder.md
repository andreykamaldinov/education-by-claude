**Builder** строит сложный объект пошагово. Он полезен, когда у объекта много необязательных параметров, важен порядок шагов или нужно получить разные представления по одному процессу построения.

## Проблема: телескопический конструктор

```ts
new HttpRequestConfig('GET', '/api/users', undefined, undefined, 5000, true, 3, undefined, 'json');
// что здесь значит true? а 3?
```

Объект с параметрами решает часть проблемы, но не порядок и валидацию шагов.

## Fluent Builder

```ts
type Query = {
  readonly table: string;
  readonly fields: readonly string[];
  readonly conditions: readonly string[];
  readonly order?: { readonly field: string; readonly direction: 'asc' | 'desc' };
  readonly limit?: number;
};

export class QueryBuilder {
  #fields: string[] = ['*'];
  #conditions: string[] = [];
  #order?: Query['order'];
  #limit?: number;

  constructor(private readonly table: string) {}

  select(...fields: string[]): this {
    this.#fields = fields;
    return this;
  }

  where(condition: string): this {
    this.#conditions.push(condition);
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.#order = { field, direction };
    return this;
  }

  limit(count: number): this {
    if (count <= 0) throw new RangeError('limit должен быть положительным');
    this.#limit = count;
    return this;
  }

  build(): Query {
    return {
      table: this.table,
      fields: [...this.#fields],
      conditions: [...this.#conditions],
      ...(this.#order && { order: this.#order }),
      ...(this.#limit !== undefined && { limit: this.#limit }),
    };
  }
}

const query = new QueryBuilder('users').select('id', 'name').where('active = true').orderBy('name').limit(20).build();
```

Возврат `this` позволяет строить цепочки вызовов (**fluent interface**). `build()` возвращает неизменяемый результат и может проверить согласованность всех параметров.

## Иммутабельный builder

Каждый шаг возвращает **новый** builder — можно безопасно переиспользовать промежуточные состояния:

```ts
const base = HttpParamsBuilder.empty().set('lang', 'ru');
const page1 = base.set('page', 1).build();
const page2 = base.set('page', 2).build(); // base не изменился
```

## Builder в Angular и вокруг

### HttpParams и HttpHeaders

```ts
const params = new HttpParams().set('page', 2).set('size', 20).append('tag', 'angular');
const headers = new HttpHeaders().set('Accept-Language', 'ru');
```

Оба иммутабельны: `set` возвращает новый объект. Частая ошибка:

```ts
const params = new HttpParams();
params.set('page', 2); // результат потерян — params по-прежнему пуст
```

### FormBuilder

```ts
const form = inject(NonNullableFormBuilder).group({
  name: ['', Validators.required],
  addresses: this.fb.array([this.createAddress()]),
});
```

### Конфигурация через функции provideX

```ts
provideRouter(routes, withComponentInputBinding(), withViewTransitions(), withPreloading(PreloadAllModules));
provideHttpClient(withFetch(), withInterceptors([auth]));
```

Это вариант builder-а: базовая конфигурация + набор «фич», которые применяются по очереди. Tree-shakable — неиспользуемые фичи не попадают в бандл.

### Тестовые данные

Builder особенно удобен для фикстур:

```ts
export const aUser = (overrides: Partial<User> = {}): User => ({
  id: 'u-1',
  name: 'Анна',
  email: 'anna@example.com',
  role: 'viewer',
  ...overrides,
});

const admin = aUser({ role: 'admin' });
```

Функция с `overrides` — облегчённый builder (паттерн Test Data Builder / Object Mother): тест указывает только то, что для него важно.

## Когда не нужен

Если у объекта 2–3 параметра и нет правил согласованности — объект-литерал с типом проще и понятнее.

> [!INTERVIEW]
> «Где вы встречали Builder в Angular?» — `HttpParams` и `HttpHeaders` — иммутабельные builder-ы: каждый `set` возвращает новый объект. `FormBuilder` пошагово строит группу контролов. Функции `provideRouter(routes, withX(), withY())` и `provideHttpClient(withFetch(), ...)` строят конфигурацию из фич. В тестах — функции-фабрики фикстур с переопределениями.

## Коротко

- Builder строит сложный объект пошагово и проверяет итог в `build()`.
- Fluent-интерфейс — возврат `this`; иммутабельный вариант — новый объект на каждом шаге.
- `HttpParams`/`HttpHeaders` иммутабельны — сохраняйте результат `set`.
- `provideX(withA(), withB())` — builder конфигурации в Angular.
- Для тестовых данных — фабрики с `overrides`.
