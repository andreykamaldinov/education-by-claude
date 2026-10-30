Итераторы — единый протокол перебора в JavaScript: на нём работают `for...of`, spread `...`, деструктуризация массивов, `Array.from`, `Promise.all`, `Map` и `Set`. Генераторы — удобный способ эти итераторы создавать и заодно писать функции, которые можно приостанавливать.

## Протокол итерации

Объект **итерируемый**, если у него есть метод `[Symbol.iterator]()`, возвращающий **итератор**. Итератор — объект с методом `next()`, который возвращает `{ value, done }`.

```js
const range = {
  from: 1,
  to: 4,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};

for (const n of range) console.log(n); // 1 2 3 4
[...range]; // [1, 2, 3, 4]
const [first, second] = range; // 1, 2
```

Встроенные итерируемые: `Array`, `String` (по символам Unicode, а не по UTF-16 единицам), `Map`, `Set`, `arguments`, `NodeList`, `TypedArray`. Обычный объект `{}` — не итерируемый: для него есть `Object.entries`.

## Генераторы

Функция с `*` возвращает **генератор** — объект, который одновременно итератор и итерируемое. `yield` отдаёт значение и приостанавливает выполнение до следующего `next()`.

```js
function* range(from, to) {
  for (let i = from; i <= to; i++) {
    yield i;
  }
}

const gen = range(1, 3);
gen.next(); // { value: 1, done: false }
gen.next(); // { value: 2, done: false }
gen.next(); // { value: 3, done: false }
gen.next(); // { value: undefined, done: true }

[...range(1, 5)]; // [1, 2, 3, 4, 5]
```

Тот же `range`-объект из первого примера пишется короче:

```js
const range2 = {
  from: 1,
  to: 4,
  *[Symbol.iterator]() {
    for (let i = this.from; i <= this.to; i++) yield i;
  },
};
```

## Ленивость и бесконечные последовательности

Генератор вычисляет значения по требованию, поэтому последовательность может быть бесконечной:

```js
function* naturals() {
  let n = 1;
  while (true) yield n++;
}

function* take(iterable, count) {
  if (count <= 0) return;
  for (const value of iterable) {
    yield value;
    if (--count === 0) return;
  }
}

[...take(naturals(), 5)]; // [1, 2, 3, 4, 5]
```

## Итераторные хелперы (ES2025)

Современные движки добавили методы прямо к итераторам — ленивые аналоги методов массива:

```js
naturals()
  .filter((n) => n % 2 === 0)
  .map((n) => n * n)
  .take(3)
  .toArray(); // [4, 16, 36]

Iterator.from(someIterable).drop(2).forEach(console.log);
```

В отличие от `array.map().filter()`, промежуточные массивы не создаются.

## Двусторонняя связь: next(value), return, throw

`yield` — выражение: значение, переданное в `next(value)`, становится результатом `yield` внутри генератора.

```js
function* dialog() {
  const name = yield 'Как вас зовут?';
  const city = yield `Привет, ${name}! Откуда вы?`;
  return `${name} из города ${city}`;
}

const talk = dialog();
talk.next().value; // 'Как вас зовут?'
talk.next('Анна').value; // 'Привет, Анна! Откуда вы?'
talk.next('Казань'); // { value: 'Анна из города Казань', done: true }
```

- `gen.return(value)` завершает генератор (выполнятся блоки `finally`).
- `gen.throw(error)` бросает ошибку в точке `yield`.
- `yield* other` делегирует перебор другому итерируемому.

> [!NOTE]
> На этом механизме когда-то строили async/await (библиотека `co`) и до сих пор строят redux-saga: генератор отдаёт «эффект», внешний раннер выполняет его и возвращает результат через `next(result)`.

## Асинхронные итераторы

`for await...of` перебирает асинхронные источники: у них `[Symbol.asyncIterator]`, а `next()` возвращает промис.

```js
async function* paginate(url) {
  let next = url;
  while (next) {
    const response = await fetch(next);
    const page = await response.json();
    yield* page.items;
    next = page.nextUrl;
  }
}

for await (const item of paginate('/api/items?page=1')) {
  render(item);
}
```

Потоки `ReadableStream` в браузере и Node.js тоже асинхронно итерируемы:

```js
const response = await fetch('/api/llm/stream');
for await (const chunk of response.body.pipeThrough(new TextDecoderStream())) {
  output.textContent += chunk;
}
```

## Итераторы и Observable

И итератор, и Observable — последовательности значений. Разница в том, кто управляет темпом:

| | Iterator | Observable |
| --- | --- | --- |
| Модель | pull — потребитель вызывает `next()` | push — источник сам шлёт значения |
| Время | синхронно (или промисы для async) | любое |
| Пример | обход дерева, пагинация «по требованию» | клики, WebSocket, таймеры |

`from(iterable)` превращает итерируемое в Observable.

## Коротко

- Итерируемый объект имеет `[Symbol.iterator]`, итератор — метод `next()`.
- `function*` создаёт генератор; `yield` приостанавливает выполнение.
- Генераторы ленивы — подходят для бесконечных и тяжёлых последовательностей.
- `for await...of` и `async function*` — для асинхронных источников и стримов.
- Итераторные хелперы (`map`, `filter`, `take`) работают лениво без промежуточных массивов.
