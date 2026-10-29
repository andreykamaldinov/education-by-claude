Ошибка в RxJS — терминальное событие: после `error` поток завершён навсегда. Поэтому главный вопрос не «как поймать ошибку», а «**где** её поймать, чтобы не убить нужный поток».

## Что происходит при ошибке

```ts
interval(500)
  .pipe(
    map((n) => {
      if (n === 2) throw new Error('сбой на 2');
      return n;
    }),
  )
  .subscribe({
    next: (n) => console.log(n),
    error: (e) => console.error(e.message),
  });
// 0, 1, «сбой на 2» — и больше ничего, interval отписан
```

Исключение в любом операторе превращается в событие `error`, которое идёт вниз по цепочке, минуя `next`-обработчики, до первого `catchError` или до подписчика.

> [!WARNING]
> Если у подписчика нет обработчика `error`, ошибка уходит в глобальный обработчик (в Angular — `ErrorHandler`), а в консоли появляется «Uncaught». Всегда обрабатывайте ошибки либо в `catchError`, либо в `error` подписчика.

## catchError

`catchError` перехватывает ошибку и **заменяет** упавший поток другим Observable:

```ts
this.api.loadUser(id).pipe(
  catchError((error: unknown) => {
    this.notifications.show('Не удалось загрузить профиль');
    return of(null); // продолжить с запасным значением
  }),
);
```

Варианты возврата:

| Вернуть | Результат |
| --- | --- |
| `of(fallback)` | значение по умолчанию и complete |
| `EMPTY` | просто завершить без значений |
| `throwError(() => mappedError)` | пробросить (возможно, преобразованную) ошибку дальше |
| `caught` (второй аргумент) | переподписаться на исходный поток — осторожно, бесконечный цикл |

## Где ставить catchError

Это ключевой момент. Сравните:

```ts
// 1. catchError снаружи — ПЕРВАЯ ошибка завершит весь поиск
query$.pipe(
  switchMap((q) => this.api.search(q)),
  catchError(() => of([])), // поток query$ уже отписан — больше поиска не будет
);

// 2. catchError внутри — ошибка заменяет только один запрос
query$.pipe(
  switchMap((q) =>
    this.api.search(q).pipe(
      catchError(() => of([])), // внешний поток живёт дальше
    ),
  ),
);
```

Правило: **для долгоживущих потоков (события, ввод, WebSocket) ловите ошибки внутри операторов высшего порядка**, на уровне отдельной операции.

## retry

```ts
this.api.load().pipe(retry(3)); // до 3 повторных подписок при ошибке

this.api.load().pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => {
      if (error instanceof HttpErrorResponse && error.status < 500) {
        return throwError(() => error); // 4xx не повторяем
      }
      return timer(2 ** retryCount * 250); // экспоненциальная задержка: 500, 1000, 2000 мс
    },
    resetOnSuccess: true,
  }),
);
```

`retry` переподписывается на **исходный** поток — для HTTP это новый запрос.

> [!WARNING]
> Повторяйте только идемпотентные операции (GET, PUT с тем же телом). Повтор POST «создать заказ» после таймаута может создать два заказа, если первый запрос всё-таки дошёл до сервера.

Устаревший `retryWhen` заменён конфигурацией `retry({ delay })`.

## finalize

Выполняется при **любом** завершении: `complete`, `error` или отписка.

```ts
this.loading.set(true);
this.api.save(data)
  .pipe(finalize(() => this.loading.set(false)))
  .subscribe(...);
```

Правильное место для сброса индикатора загрузки — иначе при ошибке спиннер останется навсегда.

## timeout

```ts
this.api.load().pipe(
  timeout({ first: 5000, with: () => throwError(() => new TimeoutError()) }),
);
```

## Ошибки как данные

Для UI часто удобнее превратить ошибку в обычное значение состояния, чем держать два канала:

```ts
type Loadable<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function toLoadable<T>(source$: Observable<T>): Observable<Loadable<T>> {
  return source$.pipe(
    map((data) => ({ status: 'success' as const, data })),
    catchError((e: unknown) => of({ status: 'error' as const, message: String(e) })),
    startWith({ status: 'loading' as const }),
  );
}

readonly orders$ = this.reload$.pipe(switchMap(() => toLoadable(this.api.orders())));
```

```html
@switch ((orders$ | async)?.status) { ... }
```

Тот же подход у `resource()` в Angular — статус и ошибка доступны как сигналы.

## Ошибки в subscribe-колбэке

Исключение, брошенное внутри `next`-обработчика подписчика, **не** попадёт в `catchError` выше по цепочке — оно возникает уже после оператора. RxJS отправит его в глобальный обработчик асинхронно. Держите логику в операторах, а `subscribe` — минимальным.

> [!INTERVIEW]
> «Поиск перестал работать после первой ошибки сети. Почему?» — Ошибка завершает поток. Если `catchError` стоит после `switchMap` на внешнем потоке, он заменяет весь поток запасным, и подписка на ввод пропадает. Нужно перенести `catchError` внутрь `switchMap` — на поток конкретного запроса, — тогда ошибка заменит только один результат, а внешний поток продолжит работать.

## Коротко

- Ошибка — терминальное событие; поток после неё мёртв.
- `catchError` заменяет упавший поток: `of(fallback)`, `EMPTY` или `throwError`.
- В долгоживущих потоках ловите ошибки внутри `switchMap`/`mergeMap`.
- `retry({ count, delay })` — повторы с задержкой, только для идемпотентных операций.
- `finalize` — гарантированная очистка (сброс индикатора загрузки).
