Операторы создания строят Observable из значений, коллекций, событий, таймеров и промисов. Это точки входа в мир потоков.

## of и from

```ts
of(1, 2, 3); // --1-2-3|   — каждое значение аргумента
of([1, 2, 3]); // --[1,2,3]| — один массив как одно значение

from([1, 2, 3]); // --1-2-3|   — элементы итерируемого
from(fetch('/api')); // Promise → одно значение и complete
from('ab'); // --a-b|     — строка итерируема
from(asyncGenerator()); // асинхронный итератор
```

`of` и `from` для синхронных источников выдают значения **синхронно** при подписке.

## fromEvent

```ts
const resize$ = fromEvent(window, 'resize');
const keydown$ = fromEvent<KeyboardEvent>(document, 'keydown');
const input$ = fromEvent<InputEvent>(inputElement, 'input', { passive: true });
```

Слушатель вешается при подписке и снимается при отписке. Работает с DOM, Node.js `EventEmitter` и объектами с `addEventListener`/`on`.

## interval и timer

```ts
interval(1000); // --0--1--2--3-- … каждую секунду, бесконечно
timer(500); // ----0|          — одно значение через 500 мс
timer(0, 5000); // 0 сразу, затем каждые 5 с — удобно для polling
timer(new Date('2026-12-31T23:59:59')); // в конкретный момент
```

```ts
// Polling: сразу и затем каждые 10 секунд, с отменой предыдущего запроса
const prices$ = timer(0, 10_000).pipe(switchMap(() => this.api.prices()));
```

## defer

Создаёт Observable лениво — фабрика вызывается при **каждой** подписке:

```ts
const now$ = defer(() => of(new Date())); // время подписки, а не создания
const lazyRequest$ = defer(() => fetch('/api/data')); // Promise создаётся только при подписке
const random$ = defer(() => of(Math.random()));
```

Полезно, чтобы обернуть жадный Promise или выбрать поток в момент подписки:

```ts
const data$ = defer(() => (cache.has(key) ? of(cache.get(key)) : this.api.load(key)));
```

## Специальные потоки

```ts
EMPTY; // |       — сразу complete
NEVER; // ------- — ничего и никогда (не завершается)
throwError(() => new Error('сбой')); // # — сразу ошибка (фабрика, а не значение!)
```

`EMPTY` удобно возвращать из `catchError` или `switchMap`, когда «ничего не делать»:

```ts
switchMap((query) => (query.length < 2 ? EMPTY : this.api.search(query)));
```

## range, generate, iif

```ts
range(1, 5); // 1, 2, 3, 4, 5
generate({ initialState: 1, condition: (x) => x <= 64, iterate: (x) => x * 2 }); // 1, 2, 4, …, 64
iif(() => user.isAdmin, adminData$, publicData$); // выбор при подписке
```

## Комбинирующие функции создания

Многие функции создания объединяют несколько потоков: `merge`, `concat`, `combineLatest`, `forkJoin`, `zip`, `race`. Они разобраны в уроке [Комбинирование потоков](/tracks/rxjs/combination).

## ajax и webSocket

```ts
import { ajax } from 'rxjs/ajax';
import { webSocket } from 'rxjs/webSocket';

ajax.getJSON<User[]>('/api/users');

const socket$ = webSocket<Message>('wss://example.com/chat');
socket$.subscribe((msg) => console.log(msg)); // соединение открывается при подписке
socket$.next({ type: 'hello' }); // отправка
```

В Angular для HTTP используйте `HttpClient` (интерсепторы, XSRF, тесты), а `webSocket` из RxJS — хороший выбор для двустороннего канала.

## Из сигнала и в сигнал

В Angular дополнительно: `toObservable(signal)` и `toSignal(observable$)` из `@angular/core/rxjs-interop` — см. [RxJS в Angular](/tracks/angular/rxjs-interop).

> [!INTERVIEW]
> «Чем `of([1,2,3])` отличается от `from([1,2,3])`?» — `of` выдаёт каждый аргумент как отдельное значение, поэтому массив придёт одним значением. `from` перебирает итерируемый объект (или разворачивает Promise) и выдаёт элементы по одному: 1, 2, 3.

## Коротко

- `of` — аргументы как значения; `from` — элементы итерируемого, Promise, async iterable.
- `fromEvent` — события; `interval`/`timer` — время; `timer(0, n)` — polling.
- `defer` — ленивое создание на каждую подписку.
- `EMPTY`, `NEVER`, `throwError(() => err)` — специальные потоки.
- `webSocket` — двусторонний канал как Subject.
