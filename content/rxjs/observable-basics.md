RxJS — библиотека для работы с асинхронными событиями как с **потоками**: последовательностями значений во времени. Клики, HTTP-ответы, таймеры, сообщения WebSocket, изменения формы — всё это потоки, которые можно фильтровать, преобразовывать и комбинировать операторами.

## Observable

Observable — описание того, как производить значения. Пока на него никто не подписался, ничего не происходит.

```ts
import { Observable } from 'rxjs';

const numbers$ = new Observable<number>((subscriber) => {
  console.log('продюсер запущен');
  subscriber.next(1);
  subscriber.next(2);
  const id = setTimeout(() => {
    subscriber.next(3);
    subscriber.complete();
  }, 1000);

  return () => {
    console.log('очистка');
    clearTimeout(id); // teardown: вызывается при complete, error или отписке
  };
});
```

Суффикс `$` — соглашение для переменных-потоков.

## Подписка и Observer

```ts
const subscription = numbers$.subscribe({
  next: (value) => console.log('значение', value),
  error: (err) => console.error('ошибка', err),
  complete: () => console.log('готово'),
});

// продюсер запущен → значение 1 → значение 2 → (через секунду) значение 3 → готово → очистка
```

**Observer** — объект с тремя колбэками. Можно передать только функцию для `next`: `numbers$.subscribe((v) => ...)`.

## Контракт Observable

```text
next*  (error | complete)?
```

- Любое количество `next` (в том числе ноль или бесконечность).
- Затем **максимум одно** терминальное событие: `error` или `complete`.
- После `error`/`complete` больше ничего не приходит, а подписка закрывается.

```text
--1--2--3--|        поток завершился
--1--2--#           поток упал с ошибкой
--1--2--3--4--...   бесконечный поток (interval, клики)
```

Так выглядят **marble-диаграммы**: `-` — время, значения — символы, `|` — complete, `#` — error.

## Ленивость и unicast

Каждая подписка запускает продюсер **заново** и получает собственное выполнение:

```ts
numbers$.subscribe((v) => console.log('A', v));
numbers$.subscribe((v) => console.log('B', v));
// «продюсер запущен» выведется дважды
```

Поэтому `this.http.get(...)` без подписки не отправляет запрос, а две подписки — отправляют два. Подробнее — в уроке [Горячие и холодные Observable](/tracks/rxjs/hot-cold).

## Отписка

```ts
const sub = interval(1000).subscribe((n) => console.log(n));

setTimeout(() => sub.unsubscribe(), 3500); // 0, 1, 2 — затем очистка

// Несколько подписок в одной
const bag = new Subscription();
bag.add(stream1$.subscribe());
bag.add(stream2$.subscribe());
bag.unsubscribe(); // отписаться от всех
```

Отписка вызывает функцию очистки продюсера: таймер остановится, HTTP-запрос отменится, слушатель события снимется.

## Синхронность

Observable может выдавать значения синхронно — прямо во время вызова `subscribe`:

```ts
console.log('до');
of(1, 2).subscribe((v) => console.log(v));
console.log('после');
// до, 1, 2, после
```

В отличие от промиса, который всегда асинхронен.

## Операторы и pipe

**Pipeable-оператор** — функция, которая принимает Observable и возвращает новый Observable. `pipe` соединяет операторы:

```ts
import { filter, fromEvent, map, throttleTime } from 'rxjs';

const clicks$ = fromEvent<MouseEvent>(document, 'click').pipe(
  throttleTime(300), // не чаще одного раза в 300 мс
  map((event) => ({ x: event.clientX, y: event.clientY })),
  filter((point) => point.x > 100),
);

clicks$.subscribe((point) => console.log(point));
```

Исходный поток не меняется: каждый оператор создаёт новый Observable, подписывающийся на предыдущий. Подписка «протягивается» по цепочке снизу вверх, значения идут сверху вниз.

### Свой оператор

```ts
// Из существующих операторов
const filterNil = <T>() => filter((value: T): value is NonNullable<T> => value != null);

// С нуля
function multiplyBy(factor: number) {
  return (source: Observable<number>) =>
    new Observable<number>((subscriber) =>
      source.subscribe({
        next: (value) => subscriber.next(value * factor),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      }),
    );
}
```

## Observable против Promise

| | Promise | Observable |
| --- | --- | --- |
| Значений | одно | 0..∞ |
| Запуск | сразу при создании | при подписке |
| Подписчики | все получают один результат | у каждого своё выполнение (холодный) |
| Отмена | нет | `unsubscribe` |
| Синхронность | всегда асинхронный | может быть синхронным |
| Операторы | `then` | более сотни |

Преобразование: `from(promise)`, `firstValueFrom(obs$)`, `lastValueFrom(obs$)`.

> [!INTERVIEW]
> «Чем Observable отличается от Promise?» — Promise представляет одно будущее значение, выполняется сразу при создании и не отменяется. Observable — ленивый поток из любого количества значений: выполняется при подписке, каждая подписка запускает своё выполнение (для холодных потоков), может завершиться или упасть, отменяется отпиской и комбинируется операторами.

## Коротко

- Observable описывает производство значений; работа начинается при подписке.
- Контракт: `next*` и не более одного `error` или `complete`.
- Каждая подписка — отдельное выполнение продюсера (unicast).
- `unsubscribe` вызывает функцию очистки: отмена таймеров, запросов, слушателей.
- Операторы — функции `Observable → Observable`, соединяемые через `pipe`.
