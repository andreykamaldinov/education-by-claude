В RxJS больше сотни операторов, но в реальных Angular-проектах решают одни и те же задачи. Ниже — готовые рецепты, с которыми можно сверяться на работе и на собеседовании.

## Поиск с автокомплитом

```ts
readonly results$ = this.query.valueChanges.pipe(
  map((q) => q.trim()),
  debounceTime(300), // дождаться паузы в вводе
  distinctUntilChanged(), // не искать то же самое
  filter((q) => q.length >= 2),
  switchMap((q) =>
    this.api.search(q).pipe(
      catchError(() => of([])), // ошибка не убивает поиск
    ),
  ), // отменить устаревший запрос
  shareReplay({ bufferSize: 1, refCount: true }),
);
```

## Отправка формы без дублей

```ts
this.submit$.pipe(
  exhaustMap(() =>
    this.api.save(this.form.getRawValue()).pipe(
      tap(() => this.notifications.success('Сохранено')),
      catchError((e) => {
        this.notifications.error('Не удалось сохранить');
        return EMPTY;
      }),
    ),
  ),
  takeUntilDestroyed(),
).subscribe();
```

## Автосохранение черновика

```ts
this.form.valueChanges.pipe(
  debounceTime(1000),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  concatMap((draft) => this.api.saveDraft(draft)), // сохранения строго по порядку
  takeUntilDestroyed(),
).subscribe();
```

## Polling с паузой, когда вкладка скрыта

```ts
const visible$ = fromEvent(document, 'visibilitychange').pipe(
  map(() => document.visibilityState === 'visible'),
  startWith(document.visibilityState === 'visible'),
);

readonly status$ = visible$.pipe(
  switchMap((visible) => (visible ? timer(0, 10_000) : EMPTY)),
  exhaustMap(() => this.api.status()), // не начинать новый, пока идёт предыдущий
  retry({ delay: () => timer(5_000) }),
);
```

## Параллельные запросы, нужны все результаты

```ts
forkJoin({
  user: this.api.user(id),
  orders: this.api.orders(id),
}).pipe(map(({ user, orders }) => ({ ...user, orders })));
```

## Много запросов с ограничением параллельности

```ts
from(fileList).pipe(
  mergeMap((file) => this.uploader.upload(file), 3), // не больше 3 одновременно
  toArray(),
);
```

## Зависимые запросы

```ts
this.api.currentUser().pipe(
  switchMap((user) => this.api.permissions(user.roleId).pipe(map((perms) => ({ user, perms })))),
);
```

## Кеш справочника на всё приложение

```ts
readonly countries$ = this.http.get<Country[]>('/api/countries').pipe(shareReplay(1));
```

## Обновление по кнопке + автоматически

```ts
readonly data$ = merge(this.refreshClick$, interval(60_000)).pipe(
  startWith(null),
  exhaustMap(() => this.api.load()),
);
```

## Повтор с экспоненциальной задержкой

```ts
retry({ count: 4, delay: (_err, attempt) => timer(Math.min(30_000, 2 ** attempt * 500)) });
```

## Таймаут запроса

```ts
this.api.load().pipe(timeout({ first: 8_000 }), catchError(() => of(FALLBACK)));
```

## Действие + текущее состояние

```ts
this.addToCart$.pipe(
  withLatestFrom(this.cart$, this.user$),
  concatMap(([product, cart, user]) => this.api.add(user.id, cart.id, product.id)),
);
```

## Drag-and-drop

```ts
const drag$ = fromEvent<PointerEvent>(handle, 'pointerdown').pipe(
  switchMap((start) =>
    fromEvent<PointerEvent>(document, 'pointermove').pipe(
      map((move) => ({ dx: move.clientX - start.clientX, dy: move.clientY - start.clientY })),
      takeUntil(fromEvent(document, 'pointerup')),
    ),
  ),
);
```

## Дерево решений

```text
Нужно преобразовать каждое значение?               → map
Нужно накапливать состояние?                       → scan
Значение → асинхронная операция:
  важен только последний результат?                → switchMap
  нужен порядок, по одному?                        → concatMap
  параллельно, порядок не важен?                   → mergeMap (+ concurrency)
  игнорировать, пока предыдущая не закончилась?    → exhaustMap
Ввод пользователя слишком частый:
  дождаться паузы?                                 → debounceTime
  не чаще чем раз в N мс?                          → throttleTime / auditTime
Несколько потоков:
  дождаться завершения всех (HTTP)?                → forkJoin
  живое производное состояние?                     → combineLatest
  действие + текущее значение?                     → withLatestFrom
  объединить события?                              → merge
Несколько подписчиков на один источник?            → share / shareReplay
Ошибка:
  заменить значением?                              → catchError (внутри *Map)
  повторить?                                       → retry({ count, delay })
  выполнить очистку в любом случае?                → finalize
Остановить поток:
  при уничтожении компонента?                      → takeUntilDestroyed
  после N значений / первого?                      → take / first
```

> [!INTERVIEW]
> «Напишите поиск с автокомплитом на RxJS» — `valueChanges` → `debounceTime(300)` → `distinctUntilChanged()` → `filter` по минимальной длине → `switchMap` к запросу с `catchError` внутри. `switchMap` отменяет устаревшие запросы, `catchError` внутри не даёт ошибке завершить поток ввода, результат — в `async` pipe или `toSignal`.

## Коротко

- Большинство задач решаются десятком операторов.
- Выбор оператора высшего порядка = выбор поведения при конкурирующих операциях.
- Ошибки ловите внутри `*Map`, очистку — в `finalize`.
- Не забывайте про отписку и `refCount`.
