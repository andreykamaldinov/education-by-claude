Сужение типов (narrowing) — это анализ потока управления: TypeScript следит за проверками в коде и уточняет тип переменной внутри каждой ветки. Хорошо смоделированные типы плюс сужение — способ сделать некорректные состояния непредставимыми.

## Встроенные способы сужения

```ts
function describe(value: string | number | Date | null | string[]) {
  if (value === null) return 'пусто'; // равенство

  if (typeof value === 'string') return value.toUpperCase(); // typeof
  if (typeof value === 'number') return value.toFixed(2);

  if (value instanceof Date) return value.toISOString(); // instanceof

  if (Array.isArray(value)) return value.join(', '); // встроенный guard

  return value; // never — все варианты разобраны
}
```

### Оператор in

```ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim(); // Fish
  } else {
    animal.fly(); // Bird
  }
}
```

### Truthiness

```ts
function greet(name?: string) {
  if (name) {
    return `Привет, ${name}`; // string (но пустая строка тоже отсеется!)
  }
  return 'Привет, гость';
}
```

## Discriminated unions

Самый мощный приём. У каждого варианта есть общее поле-дискриминант с литеральным типом:

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function render(state: RequestState<User[]>) {
  switch (state.status) {
    case 'idle':
      return 'Нажмите «Загрузить»';
    case 'loading':
      return 'Загрузка…';
    case 'success':
      return `Пользователей: ${state.data.length}`; // data доступна только здесь
    case 'error':
      return `Ошибка: ${state.error}`;
  }
}
```

Сравните с «мешком опциональных полей»:

```ts
// Плохо: можно получить loading=true и data одновременно, или error без статуса
type BadState = { loading: boolean; data?: User[]; error?: string };
```

## Исчерпывающая проверка через never

Добавили новый статус — компилятор должен указать на все места, где он не обработан:

```ts
const assertNever = (value: never): never => {
  throw new Error(`Необработанный вариант: ${JSON.stringify(value)}`);
};

function icon(state: RequestState<unknown>): string {
  switch (state.status) {
    case 'idle':
      return '○';
    case 'loading':
      return '◌';
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    default:
      return assertNever(state); // если появится 'cancelled' — ошибка компиляции
  }
}
```

В шаблонах Angular `@switch` тоже сужает типы, а в современных версиях поддерживает проверку исчерпываемости: блок `@default never;` вызовет ошибку компиляции шаблона, если какой-то вариант не обработан.

## Пользовательские type guards

Функция с возвращаемым типом `value is T`:

```ts
type Article = { kind: 'article'; title: string };

function isArticle(value: unknown): value is Article {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === 'article' &&
    'title' in value &&
    typeof value.title === 'string'
  );
}

const items: unknown[] = await response.json();
const articles = items.filter(isArticle); // Article[]
```

> [!WARNING]
> Тело guard-функции должно действительно проверять то, что обещает сигнатура. Компилятор верит `value is Article` на слово. «Лживый» guard хуже `as`: ошибка прячется за именем, которое звучит безопасно.

С TypeScript 5.5 простые guard-ы выводятся автоматически:

```ts
const defined = [1, undefined, 2].filter((x) => x !== undefined); // number[]
```

## Assertion functions

Функция, которая бросает ошибку, если условие ложно, и сужает тип после вызова:

```ts
function assertIsDefined<T>(value: T, name: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`${name} не определено`);
  }
}

const el = document.querySelector('#app');
assertIsDefined(el, '#app');
el.append('готово'); // Element, не Element | null
```

## Иерархия способов сужения

От самого надёжного к наименее надёжному:

1. Дискриминант в `switch` с `assertNever`.
2. Оператор `in`.
3. `typeof` / `instanceof` / `Array.isArray`.
4. Пользовательский type guard (с честной проверкой).
5. `as` — только после валидации (например, схемой).

## Сужение и замыкания

Сужение «забывается» внутри колбэков, если переменная может измениться:

```ts
let current: string | null = getValue();

if (current !== null) {
  setTimeout(() => {
    current.length; // ошибка: к моменту вызова current мог стать null
  });
}

const stable = current; // const — сужение сохраняется
if (stable !== null) {
  setTimeout(() => stable.length);
}
```

То же самое с сигналами Angular: `if (this.user())` не сужает следующий вызов `this.user()`. Сохраните значение в константу: `const user = this.user(); if (user) { ... }`. В шаблоне используйте `@if (user(); as user)`.

## Коротко

- TypeScript сужает типы по проверкам `typeof`, `instanceof`, `in`, `===`, truthiness.
- Discriminated unions + `switch` — основной способ моделировать состояния.
- `assertNever` в `default` делает `switch` исчерпывающим.
- Guard-функции `value is T` и assertion-функции `asserts value is T` — для своих проверок.
- Сужение не переживает колбэки для изменяемых переменных — используйте `const`.
