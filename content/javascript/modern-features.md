Стандарт ECMAScript обновляется каждый год. Многие возможности последних лет уже стали повседневными, и на собеседовании ожидают, что вы ими пользуетесь. Ниже — то, что реально встречается в коде Angular-проектов, сгруппированное по году появления.

## ES2020

```js
// Optional chaining — короткое замыкание на null/undefined
const city = user?.address?.city;
const first = list?.[0];
callback?.(data);

// Nullish coalescing — значение по умолчанию только для null/undefined
const pageSize = settings.pageSize ?? 20; // 0 останется 0

// BigInt
const big = 2n ** 64n;

// Promise.allSettled
const results = await Promise.allSettled([a(), b()]);

// globalThis — глобальный объект в любой среде
globalThis.setTimeout === setTimeout; // true

// Dynamic import
const { heavy } = await import('./heavy.js');
```

## ES2021

```js
// Логические присваивания
options.retries ??= 3; // присвоить, если null/undefined
cache.value ||= compute(); // присвоить, если falsy
user.isAdmin &&= checkPermissions(); // присвоить, если truthy

// Разделители в числах
const budget = 1_000_000;

// replaceAll
'a-b-c'.replaceAll('-', '/'); // 'a/b/c'

// Promise.any, WeakRef, FinalizationRegistry
```

## ES2022

```js
class Counter {
  #count = 0; // приватное поле
  static #instances = 0; // приватное статическое
  static {
    // статический блок инициализации
    Counter.#instances = 0;
  }

  #log() {} // приватный метод

  has(obj) {
    return #count in obj; // проверка наличия приватного поля (brand check)
  }
}

// Top-level await в модулях
const config = await loadConfig();

// Array.prototype.at — отрицательные индексы
[1, 2, 3].at(-1); // 3

// Object.hasOwn — замена hasOwnProperty
Object.hasOwn(obj, 'key');

// Error cause
throw new Error('Не удалось сохранить', { cause: originalError });
```

## ES2023

```js
// Неизменяющие методы массива
const sorted = items.toSorted((a, b) => a.price - b.price);
const reversed = items.toReversed();
const patched = items.with(2, newItem);
const withoutSecond = items.toSpliced(1, 1);

// Поиск с конца
items.findLast((x) => x.active);
items.findLastIndex((x) => x.active);
```

## ES2024

```js
// Группировка
const byStatus = Object.groupBy(orders, (order) => order.status);
// { paid: [...], pending: [...] }
const byStatusMap = Map.groupBy(orders, (order) => order.status);

// Промис с внешним управлением
const { promise, resolve, reject } = Promise.withResolvers();

// Флаг v в регулярных выражениях (операции над множествами символов)
/[\p{L}--[a-z]]/v;

// Проверка корректности строк Unicode
'abc'.isWellFormed();

// ArrayBuffer с изменяемым размером, Atomics.waitAsync
```

## ES2025

```js
// Методы Set — операции над множествами
const frontend = new Set(['js', 'ts', 'angular']);
const backend = new Set(['ts', 'node', 'sql']);

frontend.union(backend); // все навыки
frontend.intersection(backend); // Set { 'ts' }
frontend.difference(backend); // Set { 'js', 'angular' }
frontend.symmetricDifference(backend);
frontend.isSubsetOf(backend); // false

// Итераторные хелперы — ленивые операции без промежуточных массивов
const firstThreeEven = Iterator.from(numbers).filter((n) => n % 2 === 0).take(3).toArray();

// Promise.try — единообразно ловит и синхронные, и асинхронные ошибки
await Promise.try(() => mightThrowSync());

// Импорт JSON
import config from './config.json' with { type: 'json' };

// RegExp.escape
new RegExp(RegExp.escape(userInput));

// Float16Array, Math.f16round
```

## Явное управление ресурсами: using

Предложение уже реализовано в TypeScript (5.2+) и современных движках. `using` гарантирует вызов `[Symbol.dispose]()` при выходе из блока — как `try/finally`, но короче:

```ts
class Connection {
  [Symbol.dispose]() {
    this.close();
  }
}

function query() {
  using conn = new Connection();
  return conn.run('SELECT 1');
} // conn закрывается автоматически, даже при исключении

async function upload() {
  await using file = await openFile(); // для [Symbol.asyncDispose]
}
```

## Что из этого особенно важно для Angular

- `?.` и `??` работают и в шаблонах Angular: `{{ user?.name ?? 'Гость' }}`.
- `#private` поля и методы делают инкапсуляцию в сервисах реальной (TypeScript `private` исчезает после компиляции). Но шаблон не может обращаться к `#private` — для членов, используемых в шаблоне, нужен `protected`.
- `toSorted`, `with` и spread — основа иммутабельных обновлений сигналов.
- `Object.groupBy` удобен в `computed` для группировки списков.
- `structuredClone` (технически часть HTML-стандарта, а не ECMAScript) — для глубокого копирования состояния.

> [!INTERVIEW]
> «Чем `private` в TypeScript отличается от `#private`?» — `private` проверяется только компилятором и исчезает в JavaScript: в рантайме поле доступно, например, через `obj['field']`. `#field` — настоящее приватное поле движка: недоступно снаружи класса вообще, не видно в `Object.keys`, не конфликтует с полями наследников.

## Как узнать, что поддерживается

- Сводные таблицы совместимости — MDN и caniuse.com.
- Angular CLI компилирует код под список браузеров из `.browserslistrc` (по умолчанию — актуальные версии основных браузеров). Синтаксис, который они не поддерживают, понижается при сборке, но **полифилы для API** (например, новых методов `Set`) автоматически не добавляются — проверяйте поддержку методов отдельно.

## Коротко

- `?.`, `??`, `??=` — ежедневные инструменты.
- Классы получили `#private`, статические блоки и brand checks.
- Неизменяющие методы массивов (`toSorted`, `with`) упрощают иммутабельность.
- `Object.groupBy`, методы `Set`, итераторные хелперы — свежие и полезные.
- Синтаксис CLI понижает сам, а новые API — проверяйте по браузерам.
