RxJS долгое время был единственным реактивным инструментом Angular: HttpClient, роутер, формы возвращают Observable. Сигналы не заменяют RxJS, а занимают свою нишу — состояние. Задача разработчика — знать, где проходит граница, и уметь безопасно переходить между мирами.

## async pipe

```ts
@Component({
  imports: [AsyncPipe],
  template: `
    @if (user$ | async; as user) {
      <h1>{{ user.name }}</h1>
    } @else {
      <app-skeleton />
    }
  `,
})
export class Profile {
  protected readonly user$ = inject(UserApi).current();
}
```

`async`:

- подписывается при первом рендере и **отписывается при уничтожении** компонента;
- при новом значении вызывает `markForCheck()` — работает с `OnPush` и zoneless;
- при смене ссылки на Observable отписывается от старого и подписывается на новый.

> [!WARNING]
> Каждое использование `| async` — отдельная подписка. Три `(user$ | async)` в шаблоне на холодный HTTP-поток — три запроса. Используйте `@let user = user$ | async;` или `@if (... ; as user)` один раз, либо `shareReplay`.

## toSignal: Observable → Signal

```ts
import { toSignal } from '@angular/core/rxjs-interop';

export class Dashboard {
  private readonly route = inject(ActivatedRoute);

  readonly tab = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('tab') ?? 'overview')), {
    initialValue: 'overview',
  });

  readonly time = toSignal(interval(1000).pipe(map(() => new Date())), {
    requireSync: false,
    initialValue: new Date(),
  });
}
```

- Подписывается **сразу** при создании и отписывается при уничтожении контекста (компонента/сервиса).
- Без `initialValue` тип включает `undefined`: `Signal<T | undefined>`.
- `requireSync: true` — для потоков, которые выдают значение синхронно (`BehaviorSubject`, `startWith`): тогда `undefined` в типе нет.
- Ошибка в потоке бросается при чтении сигнала. Обрабатывайте ошибки `catchError` до `toSignal`.

## toObservable: Signal → Observable

```ts
import { toObservable } from '@angular/core/rxjs-interop';

export class Search {
  readonly query = signal('');

  readonly results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      map((q) => q.trim()),
      distinctUntilChanged(),
      switchMap((q) => (q.length < 2 ? of([]) : this.api.search(q).pipe(catchError(() => of([]))))),
    ),
    { initialValue: [] },
  );

  private readonly api = inject(SearchApi);
}
```

Это типичный рецепт: состояние — сигнал, асинхронный процесс со временем и отменой — RxJS, результат — снова сигнал.

`toObservable` выдаёт значения через `effect`, то есть асинхронно и только последнее значение за проход: синхронные `set(1); set(2); set(3)` дадут одно значение `3`.

## takeUntilDestroyed

```ts
export class LiveTicker {
  constructor() {
    inject(PriceSocket)
      .prices()
      .pipe(takeUntilDestroyed()) // в контексте инъекции DestroyRef берётся автоматически
      .subscribe((price) => this.update(price));
  }

  startPolling() {
    // вне контекста инъекции нужно передать DestroyRef явно
    interval(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh());
  }

  private readonly destroyRef = inject(DestroyRef);
}
```

`takeUntilDestroyed` должен стоять **последним** в `pipe` (или после всех операторов, создающих внутренние подписки): если после него идёт `switchMap`, внутренний поток переживёт компонент.

## outputFromObservable и rxResource

```ts
readonly visibleChange = outputFromObservable(
  fromEvent(window, 'scroll').pipe(map(() => window.scrollY > 200), distinctUntilChanged()),
);

readonly orders = rxResource({
  params: () => this.userId(),
  stream: ({ params }) => this.api.orders(params),
});
```

## Где что использовать

| Задача | Инструмент |
| --- | --- |
| Состояние компонента, производные значения | `signal`, `computed` |
| Данные по параметрам (GET) | `httpResource` / `resource` |
| Поиск с debounce, автокомплит | `toObservable` + `debounceTime` + `switchMap` |
| WebSocket, SSE, события браузера | RxJS (`webSocket`, `fromEvent`) |
| Повторы, таймауты, polling | RxJS (`retry`, `timeout`, `timer`) |
| Комбинирование нескольких асинхронных источников | RxJS (`combineLatest`, `merge`) |
| Отображение в шаблоне | сигнал (или `async` pipe для Observable) |

> [!INTERVIEW]
> «Заменят ли сигналы RxJS?» — Нет. Сигналы хорошо подходят для синхронного состояния и производных значений: у них всегда есть текущее значение и нет ручной подписки. RxJS остаётся инструментом для асинхронных процессов: событий во времени, отмены, гонок, повторов, комбинирования потоков. В Angular они работают вместе через `toSignal`, `toObservable` и `rxResource`.

## Частые ошибки

```ts
// 1. Подписка без отписки
this.api.stream().subscribe(...); // утечка, если поток бесконечный

// 2. Вложенные subscribe
this.route.params.subscribe((p) => {
  this.api.load(p['id']).subscribe((data) => ...); // нет отмены, гонки
});
// → switchMap

// 3. toSignal внутри метода или computed — новая подписка на каждый вызов
get user() { return toSignal(this.user$); } // так нельзя

// 4. Синхронизация сигнала из subscribe, хотя можно toSignal
this.user$.subscribe((u) => this.user.set(u));
```

## Коротко

- `async` pipe подписывается и отписывается сам, вызывает `markForCheck`.
- `toSignal` — Observable в сигнал; задайте `initialValue` или `requireSync`.
- `toObservable` — сигнал в поток для операторов со временем и отменой.
- `takeUntilDestroyed()` — последним в `pipe`.
- Состояние — сигналы; асинхронные процессы и события — RxJS.
