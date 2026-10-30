Утилитарные типы — встроенные в TypeScript «функции над типами». Они позволяют выводить новые типы из существующих вместо того, чтобы копировать поля вручную. Одна модель — много производных: DTO для создания, патч для обновления, readonly-версия для состояния.

## Модель для примеров

```ts
type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
};
```

## Модификаторы полей

```ts
type UserPatch = Partial<User>; // все поля необязательные
type CompleteUser = Required<Partial<User>>; // все поля обязательные
type FrozenUser = Readonly<User>; // все поля readonly (поверхностно)
```

`Partial` — типичный тип для PATCH-запроса или аргумента `update()`:

```ts
function updateUser(id: string, changes: Partial<Omit<User, 'id' | 'createdAt'>>) {}
updateUser('1', { name: 'Анна' });
```

## Выбор и исключение полей

```ts
type UserPreview = Pick<User, 'id' | 'name'>;
type NewUser = Omit<User, 'id' | 'createdAt'>; // то, что приходит из формы создания
```

> [!NOTE]
> `Omit<T, K>` не проверяет, что `K` существует в `T`: `Omit<User, 'naem'>` скомпилируется без ошибки. Если важна строгость, сделайте свою версию: `type StrictOmit<T, K extends keyof T> = Omit<T, K>`.

## Record

Объект с заданными ключами и одинаковым типом значений:

```ts
type Role = User['role'];

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Читатель',
}; // забудете роль — ошибка компиляции

type Cache = Record<string, User>; // словарь
```

## Операции над объединениями

```ts
type Status = 'idle' | 'loading' | 'success' | 'error';

type Busy = Extract<Status, 'loading'>; // 'loading'
type Settled = Exclude<Status, 'idle' | 'loading'>; // 'success' | 'error'
type MaybeUser = User | null | undefined;
type DefinitelyUser = NonNullable<MaybeUser>; // User
```

## Типы функций

```ts
function createUser(name: string, role: User['role']): Promise<User> {
  /* ... */
}

type CreateArgs = Parameters<typeof createUser>; // [name: string, role: 'admin' | 'editor' | 'viewer']
type CreateResult = ReturnType<typeof createUser>; // Promise<User>
type Created = Awaited<ReturnType<typeof createUser>>; // User

class Repository {
  constructor(url: string, retries: number) {}
}
type RepoArgs = ConstructorParameters<typeof Repository>; // [url: string, retries: number]
type Repo = InstanceType<typeof Repository>; // Repository
```

`Awaited` рекурсивно разворачивает промисы: `Awaited<Promise<Promise<number>>>` — `number`.

## Строковые утилиты

```ts
type Event = 'click' | 'focus';
type Handler = `on${Capitalize<Event>}`; // 'onClick' | 'onFocus'

Uppercase<'a'>; // 'A'
Lowercase<'A'>; // 'a'
Uncapitalize<'Name'>; // 'name'
```

## Как они устроены

Почти все утилиты — несколько строк на mapped и conditional типах. Умение написать их самостоятельно часто проверяют на собеседовании.

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] }; // -? снимает необязательность
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyRecord<K extends PropertyKey, V> = { [P in K]: V };
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;
type MyOmit<T, K extends PropertyKey> = MyPick<T, MyExclude<keyof T, K>>;
type MyNonNullable<T> = T & {};
type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;
type MyParameters<F> = F extends (...args: infer P) => unknown ? P : never;
```

Подробно механика разобрана в уроках [об условных типах](/tracks/typescript/conditional-types) и [mapped-типах](/tracks/typescript/mapped-template).

## Свои полезные утилиты

```ts
// Глубокий Readonly
type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// Сделать обязательными только некоторые поля
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// «Раскрыть» пересечение для читаемых подсказок в IDE
type Simplify<T> = { [K in keyof T]: T[K] } & {};

// Значения объекта как union
type ValueOf<T> = T[keyof T];
```

## Производные типы в Angular

```ts
// Состояние стора и его частичные обновления
type TodoState = { items: readonly Todo[]; filter: Filter; loading: boolean };
const state = signal<TodoState>(initial);

function patch(changes: Partial<TodoState>) {
  state.update((current) => ({ ...current, ...changes }));
}

// Тип значения типизированной формы
const form = new FormGroup({
  name: new FormControl('', { nonNullable: true }),
  age: new FormControl<number | null>(null),
});
type FormValue = typeof form.value; // { name?: string; age?: number | null }
type RawFormValue = ReturnType<typeof form.getRawValue>; // { name: string; age: number | null }
```

> [!TIP]
> Принцип «Derive, don't duplicate»: если тип можно вывести из уже существующего (модели, схемы, константы), выводите. Ручная копия разойдётся с оригиналом при первом же изменении.

## Коротко

- `Partial`, `Required`, `Readonly` меняют модификаторы полей.
- `Pick`, `Omit`, `Record` строят объекты из ключей.
- `Extract`, `Exclude`, `NonNullable` фильтруют объединения.
- `Parameters`, `ReturnType`, `Awaited`, `InstanceType` извлекают типы из функций и классов.
- Все утилиты — это mapped и conditional типы; их стоит уметь написать самому.
