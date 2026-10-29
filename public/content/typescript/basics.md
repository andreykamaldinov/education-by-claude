TypeScript — это JavaScript с системой типов, которая проверяется при компиляции и полностью стирается в рантайме. Типы не меняют поведение программы: они описывают, какие значения допустимы, и позволяют найти ошибки до запуска.

## Примитивы и литеральные типы

```ts
let title: string = 'Angular';
let count: number = 42;
let enabled: boolean = true;
let id: bigint = 10n;
let key: symbol = Symbol('key');
let nothing: null = null;
let missing: undefined = undefined;
```

Любое конкретное значение может быть типом:

```ts
let direction: 'up' | 'down' = 'up';
direction = 'left'; // ошибка: Type '"left"' is not assignable to type '"up" | "down"'

type HttpStatus = 200 | 201 | 400 | 404 | 500;
```

## Вывод типов

TypeScript выводит типы сам, явные аннотации нужны реже, чем кажется:

```ts
let name = 'Анна'; // string — let может измениться
const role = 'admin'; // 'admin' — литерал, const не изменится
const user = { name: 'Анна', age: 30 }; // { name: string; age: number }
const numbers = [1, 2, 3]; // number[]

function sum(a: number, b: number) {
  return a + b; // возвращаемый тип выведен как number
}
```

> [!TIP]
> Аннотируйте параметры функций и публичные API (возвращаемые типы экспортируемых функций, поля сервисов). Локальные переменные пусть выводятся — меньше шума, а ошибка всё равно найдётся.

## Массивы и кортежи

```ts
const tags: string[] = ['ts', 'js'];
const ids: Array<number> = [1, 2];
const readonlyTags: readonly string[] = ['ts']; // нет push/splice

// Кортеж — массив фиксированной длины с типом на каждой позиции
const point: [number, number] = [10, 20];
const entry: [key: string, value: number] = ['age', 30]; // именованные элементы
const optional: [string, number?] = ['a'];
const rest: [string, ...number[]] = ['sum', 1, 2, 3];
```

Кортежи часто возвращают хуки и функции, которым нужно отдать несколько значений: `const [value, setValue] = useState(0)`.

## Объекты

```ts
type User = {
  readonly id: string; // нельзя переприсвоить
  name: string;
  email?: string; // необязательное: string | undefined
  [key: `data-${string}`]: string; // индексная сигнатура по шаблону
};
```

## any, unknown, never, void

| Тип | Что значит | Когда использовать |
| --- | --- | --- |
| `any` | отключить проверку типов | практически никогда; миграция с JS |
| `unknown` | «что-то», но сначала проверь | данные извне: JSON, `catch`, сообщения |
| `never` | значения не бывает | функции, которые всегда бросают; исчерпывающие проверки |
| `void` | функция ничего полезного не возвращает | колбэки, обработчики |

```ts
function parse(json: string): unknown {
  return JSON.parse(json);
}

const data = parse('{"name":"Анна"}');
data.name; // ошибка: 'data' is of type 'unknown'

if (typeof data === 'object' && data !== null && 'name' in data) {
  data.name; // теперь можно — тип сужен
}
```

`any` «заражает» всё, к чему прикасается: результат операции с `any` — тоже `any`, ошибки перестают находиться. `unknown` — безопасная альтернатива: с ним ничего нельзя сделать без проверки.

```ts
function fail(message: string): never {
  throw new Error(message);
}
```

> [!INTERVIEW]
> «Чем `unknown` отличается от `any`?» — Оба принимают любое значение. Но `any` позволяет делать с ним что угодно без проверок (и выключает проверки для результата), а `unknown` запрещает любые операции, пока вы не сузите тип через `typeof`, `instanceof`, `in` или type guard. `unknown` — верхний тип системы, `never` — нижний.

## Объединения и пересечения

```ts
type Id = string | number; // одно ИЛИ другое
type Timestamped = { createdAt: Date };
type Named = { name: string };
type Entity = Named & Timestamped; // и то И другое

function format(id: Id) {
  return typeof id === 'number' ? id.toFixed(0) : id.toUpperCase();
}
```

## Функции

```ts
// Необязательные параметры и значения по умолчанию
function greet(name: string, greeting = 'Привет', suffix?: string): string {
  return `${greeting}, ${name}${suffix ?? ''}`;
}

// Тип функции
type Comparator<T> = (a: T, b: T) => number;

// Перегрузки — разные сигнатуры для разных входов
function toArray(value: string): string[];
function toArray(value: number): number[];
function toArray(value: string | number) {
  return [value];
}
```

## Утверждения типа

```ts
const input = document.getElementById('email') as HTMLInputElement;
const el = document.querySelector('canvas')!; // non-null assertion
```

`as` и `!` — это обещание компилятору «я знаю лучше». Если обещание ложно, ошибка всплывёт в рантайме. Предпочитайте проверки:

```ts
const el = document.getElementById('email');
if (el instanceof HTMLInputElement) {
  el.value = '';
}
```

## Типы стираются

```ts
type Admin = { role: 'admin' };

function isAdmin(user: unknown) {
  return user instanceof Admin; // ошибка: Admin — только тип, в рантайме его нет
}
```

Проверять в рантайме можно только то, что существует в JavaScript: классы, `typeof`, наличие свойств. Для валидации данных из сети используют схемы (Zod, Valibot) и выводят из них типы.

## Коротко

- Типы проверяются при компиляции и стираются в рантайме.
- Вывод типов работает хорошо — аннотируйте параметры и публичные API.
- Литеральные и объединённые типы делают значения точными.
- `unknown` вместо `any` для внешних данных; `never` для невозможного.
- `as` и `!` — обещания без проверки; предпочитайте сужение типов.
