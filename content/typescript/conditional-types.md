Условные типы — это `if` на уровне типов: `T extends U ? X : Y`. Вместе с `infer` они позволяют «разбирать» типы на части и вычислять одни типы из других. На них построены `ReturnType`, `Awaited`, `Parameters` и типизация множества библиотек.

## Синтаксис

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<42>; // false
```

`T extends U` здесь означает «T можно присвоить U» (T — подтип U).

## Дистрибутивность

Если проверяемый тип — **голый параметр** (`T`, а не `T[]` или `[T]`), а на вход пришло объединение, условие применяется к каждому члену отдельно:

```ts
type ToArray<T> = T extends unknown ? T[] : never;

type R = ToArray<string | number>; // string[] | number[]
```

Это удобно для фильтрации объединений:

```ts
type OnlyStrings<T> = T extends string ? T : never;
type S = OnlyStrings<'a' | 1 | 'b' | true>; // 'a' | 'b'
```

Чтобы отключить дистрибутивность, оберните обе стороны в кортеж:

```ts
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type R2 = ToArrayNonDist<string | number>; // (string | number)[]
```

> [!NOTE]
> `never` — пустое объединение. Дистрибутивный условный тип от `never` даёт `never`, без вычисления веток. Поэтому проверка «является ли T never» пишется как `[T] extends [never]`.

## infer: извлечение части типа

`infer X` внутри условия объявляет переменную типа, которую TypeScript выведет при сопоставлении:

```ts
type ElementType<T> = T extends readonly (infer E)[] ? E : never;
type E1 = ElementType<string[]>; // string

type Unpromise<T> = T extends Promise<infer V> ? V : T;
type V1 = Unpromise<Promise<User>>; // User

type FirstArg<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;
type F1 = FirstArg<(id: string, force: boolean) => void>; // string

type ObservableValue<T> = T extends Observable<infer V> ? V : never;
type U = ObservableValue<Observable<User[]>>; // User[]
```

### infer с ограничением

```ts
type FirstString<T> = T extends [infer S extends string, ...unknown[]] ? S : never;
type FS = FirstString<['a', 1]>; // 'a'
type FN = FirstString<[1, 'a']>; // never
```

## Рекурсивные типы

Условные типы могут ссылаться на себя:

```ts
type DeepAwaited<T> = T extends Promise<infer V> ? DeepAwaited<V> : T;

type Flatten<T> = T extends readonly (infer E)[] ? Flatten<E> : T;
type F = Flatten<number[][][]>; // number

// Путь в объекте: 'user' | 'user.address' | 'user.address.city'
type Paths<T> = T extends object
  ? {
      [K in keyof T & string]: K | `${K}.${Paths<T[K]>}`;
    }[keyof T & string]
  : never;

type P = Paths<{ user: { address: { city: string } } }>;
```

> [!WARNING]
> У компилятора есть ограничение глубины рекурсии (около 1000 уровней для хвостовой рекурсии и намного меньше для обычной). Слишком «умные» типы замедляют IDE и сборку. Если тип занимает экран и никто в команде не может его прочитать — упростите.

## Практический пример: типизированный обработчик событий

```ts
type Events = {
  login: { userId: string };
  logout: undefined;
  purchase: { orderId: string; total: number };
};

type EmitArgs<E extends keyof Events> = Events[E] extends undefined ? [] : [payload: Events[E]];

class TypedBus {
  emit<E extends keyof Events>(event: E, ...args: EmitArgs<E>): void {
    /* ... */
  }
}

const bus = new TypedBus();
bus.emit('logout'); // ок — payload не нужен
bus.emit('login', { userId: '1' }); // ок
bus.emit('login'); // ошибка — payload обязателен
bus.emit('purchase', { orderId: '1' }); // ошибка — нет total
```

## Пример: тип ответа по методу API

```ts
type Api = {
  getUser: (id: string) => Promise<User>;
  listOrders: (userId: string, page: number) => Promise<Order[]>;
};

type ApiResult<M extends keyof Api> = Awaited<ReturnType<Api[M]>>;

type R1 = ApiResult<'getUser'>; // User
type R2 = ApiResult<'listOrders'>; // Order[]
```

> [!INTERVIEW]
> «Реализуйте `MyAwaited<T>`, который рекурсивно разворачивает промисы и thenable-объекты»:
> ```ts
> type MyAwaited<T> = T extends null | undefined
>   ? T
>   : T extends object & { then(onfulfilled: infer F, ...args: infer _): unknown }
>     ? F extends (value: infer V, ...args: infer _) => unknown
>       ? MyAwaited<V>
>       : never
>     : T;
> ```
> Так устроен встроенный `Awaited`. Упрощённая версия для промисов: `T extends Promise<infer V> ? MyAwaited<V> : T`.

## Коротко

- `T extends U ? X : Y` — условие на уровне типов.
- На голом параметре условный тип дистрибутивен по объединению; `[T]` отключает это.
- `infer` извлекает части типа: элементы массива, значение промиса, аргументы функции.
- Рекурсивные условные типы мощны, но дороги для компилятора и читателя.
- Многие встроенные утилиты — короткие условные типы.
