Дженерики — параметры для типов. Они позволяют написать функцию, класс или тип один раз и сохранить точность типов для любого конкретного использования. Без дженериков пришлось бы выбирать между дублированием кода и `any`.

## Обобщённые функции

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const n = first([1, 2, 3]); // number | undefined
const s = first(['a', 'b']); // string | undefined
const explicit = first<boolean>([]); // явный аргумент типа
```

`T` выводится из аргументов. Сравните с `any`: `function first(items: any[]): any` теряет информацию о типе элементов.

## Ограничения: extends

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest('abc', 'de'); // string
longest([1, 2], [3]); // number[]
longest(10, 20); // ошибка: number не имеет length
```

### keyof и доступ по ключу

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Анна', age: 30 };
getProp(user, 'name'); // string
getProp(user, 'age'); // number
getProp(user, 'email'); // ошибка: '"email"' не является ключом
```

`T[K]` — **индексный доступ к типу**: тип свойства `K` объекта `T`.

## Обобщённые типы

```ts
type ApiResponse<T> = {
  data: T;
  meta: { page: number; total: number };
};

type Paginated<T> = ApiResponse<readonly T[]>;

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parseNumber(input: string): Result<number, string> {
  const value = Number(input);
  return Number.isNaN(value) ? { ok: false, error: 'не число' } : { ok: true, value };
}
```

`E = Error` — параметр по умолчанию.

## Обобщённые классы

```ts
class TypedCache<K, V> {
  readonly #store = new Map<K, { value: V; expiresAt: number }>();

  set(key: K, value: V, ttlMs: number): void {
    this.#store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key: K): V | undefined {
    const entry = this.#store.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.#store.delete(key);
      return undefined;
    }
    return entry.value;
  }
}

const users = new TypedCache<string, User>();
```

## Дженерики в Angular

Почти всё в Angular обобщённое:

```ts
const count = signal<number>(0); // WritableSignal<number>
const user = input.required<User>(); // InputSignal<User>
const selected = output<Item>(); // OutputEmitterRef<Item>

http.get<User[]>('/api/users'); // Observable<User[]>

const API_URL = new InjectionToken<string>('API_URL');
inject(API_URL); // string

const form = new FormGroup({
  email: new FormControl('', { nonNullable: true }), // FormControl<string>
});
```

> [!WARNING]
> `http.get<User[]>()` — это **не** проверка. Сервер может прислать что угодно; дженерик лишь говорит компилятору, как трактовать ответ. Валидируйте данные на границе (схемой), если не доверяете источнику.

## Вывод из контекста и const-параметры

```ts
function tuple<const T extends readonly unknown[]>(...items: T): T {
  return items;
}

const t = tuple('a', 1, true); // readonly ['a', 1, true], а не (string | number | boolean)[]
```

Модификатор `const` (TS 5.0) просит выводить максимально узкий тип — как `as const` на стороне вызывающего.

## NoInfer

Иногда параметр не должен участвовать в выводе типа:

```ts
function createStore<S extends string>(states: S[], initial: NoInfer<S>) {}

createStore(['idle', 'loading'], 'idle'); // ок
createStore(['idle', 'loading'], 'done'); // ошибка — без NoInfer S расширился бы до 'idle'|'loading'|'done'
```

## Частые ошибки

```ts
// 1. Дженерик, который ничего не связывает — бесполезен
function log<T>(value: T): void {} // то же, что (value: unknown)

// 2. Возврат T, который на самом деле не T
function create<T>(): T {
  return {} as T; // ложь: компилятор поверит, рантайм — нет
}

// 3. Слишком много параметров — признак, что функция делает лишнее
```

Правило: параметр типа должен встречаться минимум дважды (связывать вход с выходом или два входа между собой). Иначе он не нужен.

> [!INTERVIEW]
> «Напишите функцию `pick`, возвращающую объект только с указанными ключами, с точными типами»:
> ```ts
> function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
>   const result = {} as Pick<T, K>;
>   for (const key of keys) result[key] = obj[key];
>   return result;
> }
> ```
> Здесь `as` допустим: объект заполняется в следующих строках, и TypeScript не может это отследить.

## Коротко

- Дженерик — параметр типа, выводимый из аргументов.
- `extends` ограничивает допустимые типы, `keyof` и `T[K]` связывают ключи и значения.
- Параметры по умолчанию, `const`-параметры, `NoInfer` — для точного вывода.
- Дженерик в `http.get<T>` — не валидация.
- Параметр типа, встречающийся один раз, — лишний.
