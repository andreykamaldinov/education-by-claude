`enum` — одна из немногих возможностей TypeScript, которая генерирует код в рантайме. Из-за этого и нескольких неочевидных свойств во многих проектах enum заменяют на объединения литеральных типов и объекты `as const`. Разберём, почему.

## Как компилируется enum

```ts
enum Direction {
  Up,
  Down,
}
```

превращается в:

```js
var Direction;
(function (Direction) {
  Direction[(Direction['Up'] = 0)] = 'Up';
  Direction[(Direction['Down'] = 1)] = 'Down';
})(Direction || (Direction = {}));
// { 0: 'Up', 1: 'Down', Up: 0, Down: 1 } — двусторонний маппинг
```

Строковые enum двустороннего маппинга не имеют:

```ts
enum Status {
  Active = 'active',
  Blocked = 'blocked',
}
```

## Проблемы enum

### 1. Числовые enum не защищают значения

```ts
enum Level {
  Low,
  High,
}
function setLevel(level: Level) {}
setLevel(42); // в старых версиях TS — без ошибки; с TS 5.0 ошибка только для литералов вне диапазона
```

### 2. Строковые enum номинальны — литерал не подходит

```ts
function setStatus(status: Status) {}
setStatus('active'); // ошибка: '"active"' is not assignable to type 'Status'
setStatus(Status.Active); // только так
```

Неудобно, когда значение приходит из JSON или из шаблона Angular — приходится импортировать enum в компонент, чтобы использовать в шаблоне.

### 3. Код в рантайме и tree-shaking

Enum — это IIFE с мутацией объекта. Бандлеры не всегда могут его удалить, даже если он не используется.

### 4. Несовместимость с «type stripping»

Node.js умеет запускать `.ts` файлы, просто вырезая аннотации типов, а TypeScript 5.8 добавил флаг `erasableSyntaxOnly`, который запрещает конструкции с рантайм-эффектом. `enum`, `namespace` и parameter properties конструктора под этот режим не подходят — индустрия движется к «TypeScript = JavaScript + стираемые типы».

## const enum

```ts
const enum Color {
  Red = 'red',
  Green = 'green',
}
const c = Color.Red; // компилируется в const c = 'red'
```

Значения встраиваются, объекта нет. Но `const enum` ломается при `isolatedModules: true` (обязательно для esbuild, Vite и Angular CLI) при использовании через границы модулей, поэтому в современных проектах его избегают.

## Альтернатива 1: union литералов

```ts
type Status = 'active' | 'blocked' | 'pending';

function setStatus(status: Status) {}
setStatus('active'); // ок, работает с JSON и шаблонами
```

Нулевой рантайм, лучшая совместимость, автодополнение в IDE работает.

## Альтернатива 2: объект as const

Когда нужен и список значений в рантайме (для селекта, валидации), и тип:

```ts
export const STATUSES = ['active', 'blocked', 'pending'] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS = {
  active: 'Активен',
  blocked: 'Заблокирован',
  pending: 'Ожидает',
} as const satisfies Record<Status, string>;

const isStatus = (value: unknown): value is Status =>
  STATUSES.some((status) => status === value);
```

Или в стиле «объекта-enum»:

```ts
export const Direction = {
  Up: 'UP',
  Down: 'DOWN',
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction]; // 'UP' | 'DOWN'

move(Direction.Up); // как с enum
move('UP'); // и как с литералом
```

Одно имя для значения и типа допустимо: они живут в разных пространствах имён.

## Когда enum оправдан

- Проект уже последовательно использует enum и переписывать нет смысла.
- Битовые флаги: `enum Permission { Read = 1 << 0, Write = 1 << 1 }`.
- Код, генерируемый из других языков (gRPC, OpenAPI-генераторы), часто выдаёт enum — пусть остаётся.

> [!INTERVIEW]
> «Что выбрать: enum или union?» — Union-литералы не порождают кода, совместимы с обычными строками из JSON и шаблонов, лучше tree-shake'ятся и совместимы с режимом стираемых типов. Если нужен список значений в рантайме — массив или объект `as const` и выведенный из него тип. Enum оправдан для битовых флагов или в проектах, где он уже стандарт.

## Коротко

- `enum` генерирует объект в рантайме, числовой — с двусторонним маппингом.
- Строковый enum не принимает литералы — неудобно с JSON и шаблонами.
- `const enum` конфликтует с `isolatedModules`.
- Union литералов + `as const`-объект дают тип и значения без минусов enum.
