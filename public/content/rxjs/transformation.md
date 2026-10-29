Операторы трансформации меняют значения потока или накапливают из них состояние. Это самые используемые операторы после `filter`.

## map

```ts
users$.pipe(map((users) => users.filter((u) => u.active).length));

http.get<ApiResponse>('/api/items').pipe(map((response) => response.data));
```

```text
--1--2--3--|
map(x => x * 10)
--10-20-30-|
```

`map` синхронно преобразует каждое значение. Если проектор возвращает Observable или Promise, получится «поток потоков» — для этого нужны [операторы высшего порядка](/tracks/rxjs/higher-order).

> [!NOTE]
> `pluck('a', 'b')` и `mapTo(value)` объявлены устаревшими и будут удалены в следующей мажорной версии RxJS — используйте `map((x) => x.a.b)` и `map(() => value)`.

## scan: накопление состояния

`scan` — как `Array.reduce`, но выдаёт **каждый промежуточный результат**:

```ts
const clicks$ = fromEvent(button, 'click');
const count$ = clicks$.pipe(scan((count) => count + 1, 0)); // 1, 2, 3, …
```

```text
--c--c--c-->
scan((acc) => acc + 1, 0)
--1--2--3-->
```

Мини-стор на `scan` — частая идея в RxJS-коде:

```ts
type Action = { type: 'add'; item: Todo } | { type: 'remove'; id: string };

const actions$ = new Subject<Action>();

const todos$ = actions$.pipe(
  scan((state: readonly Todo[], action: Action) => {
    switch (action.type) {
      case 'add':
        return [...state, action.item];
      case 'remove':
        return state.filter((t) => t.id !== action.id);
    }
  }, []),
  startWith([] as readonly Todo[]),
  shareReplay({ bufferSize: 1, refCount: true }),
);
```

Именно так устроен reducer в NgRx.

## reduce

То же, что `scan`, но выдаёт **одно** значение — после `complete` источника:

```ts
from([1, 2, 3, 4]).pipe(reduce((sum, x) => sum + x, 0)); // 10
interval(1000).pipe(reduce(...)); // никогда не выдаст значение — interval не завершается
```

## Буферизация

```ts
// Собрать события за окно времени и отправить пачкой (аналитика, логирование)
events$.pipe(
  bufferTime(2000),
  filter((batch) => batch.length > 0),
  concatMap((batch) => api.sendEvents(batch)),
);

// Пачками по N
values$.pipe(bufferCount(10));

// До сигнала другого потока
keystrokes$.pipe(buffer(enter$)); // слова до нажатия Enter

// Двойной клик
const click$ = fromEvent(el, 'click');
const doubleClick$ = click$.pipe(
  buffer(click$.pipe(debounceTime(250))),
  filter((clicks) => clicks.length === 2),
);
```

## pairwise: предыдущее и текущее

```ts
scrollY$.pipe(
  pairwise(),
  map(([prev, curr]) => (curr > prev ? 'down' : 'up')),
  distinctUntilChanged(),
); // направление прокрутки
```

## startWith и endWith

```ts
search$.pipe(startWith('')); // начать с пустой строки
loading$.pipe(startWith(true));
```

`startWith` делает поток «с начальным значением» — полезно для `combineLatest` (который не выдаёт ничего, пока каждый источник не выдал хотя бы раз).

## groupBy

Разделить поток на подпотоки по ключу:

```ts
messages$.pipe(
  groupBy((m) => m.chatId),
  mergeMap((chat$) => chat$.pipe(debounceTime(500), map((m) => markRead(m.chatId)))),
);
```

## toArray

```ts
from(ids).pipe(
  mergeMap((id) => api.load(id), 4), // не более 4 запросов параллельно
  toArray(), // собрать все ответы в массив после завершения
);
```

## Коротко

- `map` — синхронное преобразование каждого значения.
- `scan` — накопление с выдачей промежуточных результатов (reducer); `reduce` — только итог после complete.
- `bufferTime`, `bufferCount`, `buffer` — пакетная обработка.
- `pairwise` — пара «предыдущее, текущее»; `startWith` — начальное значение.
- `groupBy` и `toArray` — разбиение на подпотоки и сбор в массив.
