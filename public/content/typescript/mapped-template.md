Mapped-типы перебирают ключи и строят новый объектный тип — это `for...in` на уровне типов. Template literal types делают то же для строк. Вместе они позволяют генерировать типы геттеров, событий, путей и API из одного описания.

## Mapped types

```ts
type Flags<T> = {
  [K in keyof T]: boolean;
};

type FeatureFlags = Flags<{ darkMode: unknown; newCheckout: unknown }>;
// { darkMode: boolean; newCheckout: boolean }
```

`[K in keyof T]` — перебор всех ключей `T`. Справа можно использовать `T[K]` — тип текущего свойства.

### Модификаторы

```ts
type Mutable<T> = { -readonly [K in keyof T]: T[K] }; // снять readonly
type Concrete<T> = { [K in keyof T]-?: T[K] }; // снять ?
type Frozen<T> = { +readonly [K in keyof T]: T[K] }; // + — по умолчанию
```

### Перебор произвольного объединения

```ts
type Locale = 'ru' | 'en' | 'de';
type Translations = { [L in Locale]: string };
// то же самое, что Record<Locale, string>
```

## Переименование ключей через as

С TypeScript 4.1 ключи можно преобразовывать и фильтровать:

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Фильтрация: ключ never удаляется
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K];
};

type DataOnly<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]: T[K];
};
```

## Template literal types

```ts
type Size = 'sm' | 'md' | 'lg';
type Color = 'primary' | 'danger';

type ButtonClass = `btn-${Color}-${Size}`;
// 'btn-primary-sm' | 'btn-primary-md' | ... — все 6 комбинаций

type CssVar = `--${string}`;
const v: CssVar = '--brand'; // ок
const bad: CssVar = 'brand'; // ошибка
```

Объединения в шаблоне перемножаются — следите за размером: 3 × 3 × 3 × 3 = 81 вариант.

### Разбор строк через infer

```ts
type RouteParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? Param | RouteParams<`/${Rest}`>
  : Path extends `${string}:${infer Param}`
    ? Param
    : never;

type P = RouteParams<'/users/:userId/orders/:orderId'>; // 'userId' | 'orderId'

function buildUrl<Path extends string>(path: Path, params: Record<RouteParams<Path>, string>) {
  return path.replace(/:(\w+)/g, (_, key: string) => params[key as RouteParams<Path>]);
}

buildUrl('/users/:userId/orders/:orderId', { userId: '1', orderId: '7' }); // ок
buildUrl('/users/:userId', {}); // ошибка: нет userId
```

## Пример: типизированный EventEmitter из описания

```ts
type DomainEvents = {
  userCreated: { id: string };
  orderPaid: { orderId: string; amount: number };
};

type Listeners<E> = {
  [K in keyof E & string as `on${Capitalize<K>}`]: (payload: E[K]) => void;
};

type AppListeners = Listeners<DomainEvents>;
// { onUserCreated: (payload: { id: string }) => void; onOrderPaid: (...) => void }
```

## Пример: ключи состояния с загрузкой

```ts
type WithLoading<T, K extends keyof T & string> = T & {
  [P in K as `${P}Loading`]: boolean;
} & {
  [P in K as `${P}Error`]: string | null;
};

type State = WithLoading<{ users: User[]; orders: Order[] }, 'users' | 'orders'>;
// users, orders, usersLoading, ordersLoading, usersError, ordersError
```

Похожим образом NgRx SignalStore генерирует типы методов и сигналов из описания фич (`withEntities` добавляет `entities`, `ids`, `entityMap` и т. д.).

## Гомоморфные mapped types

Mapped-тип вида `{ [K in keyof T]: ... }` называется **гомоморфным**: он сохраняет модификаторы `readonly` и `?` исходного типа, а на массивах и кортежах возвращает массив или кортеж, а не объект:

```ts
type Stringify<T> = { [K in keyof T]: string };
type S = Stringify<[number, boolean]>; // [string, string]
```

## Коротко

- `{ [K in keyof T]: ... }` — перебор ключей; `-readonly` и `-?` снимают модификаторы.
- `as` в mapped-типе переименовывает и фильтрует ключи (`never` удаляет ключ).
- Template literal types перемножают объединения строк.
- `infer` в шаблонах разбирает строки: параметры маршрутов, пути, имена событий.
- Не увлекайтесь: комбинаторный взрыв и глубокая рекурсия замедляют компилятор.
