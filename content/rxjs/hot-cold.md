Деление на горячие и холодные Observable объясняет вопросы вида «почему запрос уходит дважды» и «почему подписчик пропустил значение». Суть одна: **кто создаёт продюсера — подписка или кто-то снаружи**.

## Холодный Observable

Продюсер создаётся **внутри** Observable при каждой подписке. Каждый подписчик получает собственное, полное выполнение с начала.

```ts
const random$ = new Observable<number>((subscriber) => {
  subscriber.next(Math.random()); // продюсер создаётся на подписку
  subscriber.complete();
});

random$.subscribe((v) => console.log('A', v)); // A 0.31
random$.subscribe((v) => console.log('B', v)); // B 0.87 — другое значение
```

Холодные: `of`, `from`, `interval`, `timer`, `defer`, `ajax`, `HttpClient.get`.

```ts
const users$ = this.http.get<User[]>('/api/users');
users$.subscribe(...); // запрос 1
users$.subscribe(...); // запрос 2
```

Это поведение — не баг: холодный поток можно безопасно передать куда угодно, он не начнёт работать, пока не нужен, и каждая подписка изолирована.

## Горячий Observable

Продюсер существует **снаружи** и работает независимо от подписок. Подписчики разделяют одно выполнение и получают только значения, пришедшие **после** подписки.

```ts
const clicks$ = fromEvent(document, 'click');
// события клика происходят независимо от того, подписан ли кто-то
```

```ts
const subject = new Subject<number>();
subject.next(1); // никто не подписан — значение потеряно
subject.subscribe((v) => console.log('A', v));
subject.next(2); // A 2
subject.subscribe((v) => console.log('B', v));
subject.next(3); // A 3, B 3
```

Горячие: `Subject` и его варианты, DOM-события (продюсер — браузер), WebSocket с общим соединением, потоки после `share()`.

> [!NOTE]
> `fromEvent` формально «тёплый»: слушатель `addEventListener` вешается на каждую подписку, но источник событий — общий DOM, поэтому поведение как у горячего: пропущенные клики не повторяются.

## Unicast и multicast

- **Unicast** — у каждого подписчика своё выполнение (холодные).
- **Multicast** — одно выполнение на всех (Subject, `share`).

Превратить холодный поток в горячий (multicast) можно операторами `share` и `shareReplay`:

```ts
const users$ = this.http.get<User[]>('/api/users').pipe(shareReplay({ bufferSize: 1, refCount: true }));

users$.subscribe(...); // запрос
users$.subscribe(...); // тот же ответ, без нового запроса
```

Подробно — в уроке [share и shareReplay](/tracks/rxjs/multicasting).

## Практические последствия

### Несколько async pipe — несколько запросов

```html
<h1>{{ (user$ | async)?.name }}</h1>
<img [src]="(user$ | async)?.avatar" />
<!-- два HTTP-запроса! -->
```

Решения: одна подписка через `@let user = user$ | async;` или `@if (user$ | async; as user)`, `toSignal`, либо `shareReplay`.

### Поздний подписчик пропускает значения горячего потока

```ts
const status$ = new Subject<string>();
status$.next('ready');
status$.subscribe(console.log); // ничего — 'ready' уже прошёл
```

Если нужен «текущий» статус — `BehaviorSubject` или `ReplaySubject(1)`.

### defer: сделать вычисление ленивым

```ts
// Promise выполняется сразу при создании — запрос уйдёт, даже если никто не подпишется
const eager$ = from(fetch('/api/data'));

// defer откладывает создание Promise до подписки, и каждый подписчик получает свой запрос
const lazy$ = defer(() => fetch('/api/data'));
```

> [!INTERVIEW]
> «Что такое горячие и холодные Observable?» — Холодный создаёт продюсера при каждой подписке: каждый подписчик получает своё выполнение с начала (`HttpClient.get`, `interval`, `of`). Горячий использует внешнего продюсера, общего для всех: подписчики делят одно выполнение и видят только значения после подписки (`Subject`, DOM-события). Холодный поток делают горячим через `share`/`shareReplay`, чтобы не дублировать работу — например, HTTP-запрос.

## Коротко

- Холодный: продюсер внутри, выполнение на каждую подписку, значения с начала.
- Горячий: продюсер снаружи, общее выполнение, только новые значения.
- `HttpClient` — холодный: две подписки — два запроса.
- `share`/`shareReplay` — multicast для холодных потоков.
- `defer` делает создание продюсера (например, Promise) ленивым.
