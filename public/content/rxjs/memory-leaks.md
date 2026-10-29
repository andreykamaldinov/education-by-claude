Утечка подписки — когда компонент уничтожен, а подписка на поток продолжает работать: держит компонент в памяти, выполняет запросы, пишет в несуществующий UI. Это самая частая проблема RxJS-кода в Angular, и о ней спрашивают на каждом собеседовании.

## Когда отписываться обязательно

| Поток | Завершается сам? | Нужна отписка? |
| --- | --- | --- |
| `HttpClient` запрос | да, после ответа | не обязательно, но полезно для отмены при уходе |
| `interval`, `timer(0, n)` | нет | **да** |
| `fromEvent` | нет | **да** |
| `valueChanges` формы | нет (живёт с формой) | да, если форма живёт дольше подписки |
| `Subject` / `BehaviorSubject` сервиса | нет | **да** |
| `ActivatedRoute.params` | Angular завершает при уничтожении компонента | не обязательно |
| `Router.events`, `Store.select` | нет | **да** |
| WebSocket | нет | **да** |

Правило проще таблицы: **если не уверены, что поток конечный, — отписывайтесь**.

## Способ 1: не подписываться вручную

Лучшая подписка — та, которой нет в вашем коде.

```ts
@Component({
  template: `
    @if (user$ | async; as user) { <h1>{{ user.name }}</h1> }
    <p>{{ time() | date: 'HH:mm:ss' }}</p>
  `,
})
export class Header {
  protected readonly user$ = inject(UserService).current$; // async pipe отпишется сам
  protected readonly time = toSignal(interval(1000).pipe(map(() => new Date()))); // toSignal — тоже
}
```

## Способ 2: takeUntilDestroyed

```ts
export class LiveChart {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    inject(PriceSocket).prices$
      .pipe(takeUntilDestroyed()) // DestroyRef берётся из контекста инъекции
      .subscribe((p) => this.draw(p));
  }

  attachExtra(stream$: Observable<number>) {
    stream$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(); // вне конструктора — явно
  }
}
```

## Способ 3 (старый): takeUntil + Subject

```ts
private readonly destroy$ = new Subject<void>();

ngOnInit() {
  this.store.select(selectCart).pipe(takeUntil(this.destroy$)).subscribe(...);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

Работает, но больше шаблонного кода. Встречается в проектах до Angular 16.

## Способ 4: Subscription

```ts
private readonly subscriptions = new Subscription();

ngOnInit() {
  this.subscriptions.add(a$.subscribe());
  this.subscriptions.add(b$.subscribe());
}

ngOnDestroy() {
  this.subscriptions.unsubscribe();
}
```

## Ловушка: порядок операторов

```ts
// Утечка: takeUntilDestroyed отпишет внешний поток, но switchMap уже подписался на внутренний interval
source$.pipe(
  takeUntilDestroyed(),
  switchMap(() => interval(1000)),
).subscribe();

// Правильно: takeUntilDestroyed последним
source$.pipe(
  switchMap(() => interval(1000)),
  takeUntilDestroyed(),
).subscribe();
```

ESLint-правило `rxjs-x/no-unsafe-takeuntil` ловит эту ошибку для `takeUntil`.

## Ловушка: shareReplay без refCount

```ts
readonly data$ = this.userId$.pipe(
  switchMap((id) => this.api.liveData(id)),
  shareReplay(1), // подписка на liveData останется после ухода всех подписчиков
);
```

Используйте `shareReplay({ bufferSize: 1, refCount: true })` для бесконечных источников. Подробнее — [share и shareReplay](/tracks/rxjs/multicasting).

## Ловушка: подписка в сервисе с временем жизни root

```ts
@Injectable({ providedIn: 'root' })
export class Tracker {
  track(component: object) {
    fromEvent(window, 'scroll').subscribe(() => this.log(component)); // компонент удерживается навсегда
  }
}
```

Сервис-синглтон живёт всё время работы приложения, и замыкание держит компонент. Возвращайте `Observable` или принимайте `DestroyRef` вызывающего.

## Ловушка: подписка внутри subscribe

```ts
this.route.params.subscribe((params) => {
  this.api.stream(params['id']).subscribe(...); // при каждой смене параметра — ещё одна вечная подписка
});
```

Решение — `switchMap`, который отпишется от предыдущего внутреннего потока.

## Как обнаружить утечку

1. Открыть и закрыть страницу несколько раз; в Chrome DevTools → Memory сравнить heap snapshot — ищите растущее число экземпляров компонента.
2. Поставить `tap({ subscribe: () => console.log('sub'), finalize: () => console.log('unsub') })` на подозрительный поток.
3. Network: запросы продолжают уходить после ухода со страницы — явная утечка polling-а.

> [!INTERVIEW]
> «Как вы управляете подписками в Angular?» — Стараюсь не подписываться вручную: `async` pipe, `toSignal`, `httpResource`, которые отписываются сами. Если подписка нужна, использую `takeUntilDestroyed()` последним оператором в `pipe`. Слежу за `shareReplay` с `refCount: true` для бесконечных потоков и избегаю вложенных `subscribe`, заменяя их на `switchMap`/`concatMap`.

## Коротко

- Бесконечные потоки (`interval`, события, Subject, store) требуют отписки.
- Лучше всего — `async` pipe и `toSignal`, они отписываются сами.
- `takeUntilDestroyed()` — последним в `pipe`.
- `shareReplay` без `refCount` и подписки в root-сервисах — частые скрытые утечки.
- Вложенный `subscribe` → оператор высшего порядка.
