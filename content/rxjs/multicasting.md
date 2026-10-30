`share` и `shareReplay` превращают холодный поток в горячий: несколько подписчиков используют одно выполнение источника. Без них каждый `async` pipe и каждый `subscribe` на HTTP-поток отправляет отдельный запрос. С неправильными настройками — получаются утечки и устаревшие данные.

## Проблема

```ts
readonly user$ = this.http.get<User>('/api/me');
```

```html
<header>{{ (user$ | async)?.name }}</header>
<aside>{{ (user$ | async)?.email }}</aside>
<!-- 2 запроса -->
```

## share

```ts
readonly ticks$ = interval(1000).pipe(
  tap((n) => console.log('источник', n)),
  share(),
);
```

- Первый подписчик запускает источник через внутренний `Subject`.
- Остальные подключаются к **уже идущему** выполнению и получают только новые значения.
- Когда отписался последний подписчик — источник отписывается (`resetOnRefCountZero: true` по умолчанию). Следующий подписчик запустит его заново.

```ts
share({
  connector: () => new ReplaySubject(1), // какой Subject использовать
  resetOnError: true,
  resetOnComplete: true,
  resetOnRefCountZero: true, // или () => timer(1000) — отписаться с задержкой
});
```

`share` подходит для общих **живых** потоков: WebSocket, события, polling — чтобы не открывать соединение на каждого подписчика.

## shareReplay

`shareReplay` = `share` с `ReplaySubject`: новые подписчики **сразу получают последние значения**, даже если подключились позже.

```ts
readonly user$ = this.http.get<User>('/api/me').pipe(shareReplay({ bufferSize: 1, refCount: true }));
```

Теперь второй `async` pipe получит закешированный ответ без нового запроса.

### refCount: важнейшая опция

```ts
shareReplay(1); // то же, что { bufferSize: 1, refCount: false }
shareReplay({ bufferSize: 1, refCount: true });
```

| `refCount` | Когда все подписчики ушли |
| --- | --- |
| `false` (по умолчанию для `shareReplay(1)`) | подписка на источник **остаётся**; кеш живёт вечно |
| `true` | источник отписывается; следующий подписчик запустит его заново |

Для HTTP-запроса, который завершается сам, разница невелика — кеш просто остаётся. Но для **бесконечного** источника `refCount: false` — утечка:

```ts
// Утечка: interval будет тикать вечно, даже когда компонент уничтожен
readonly time$ = interval(1000).pipe(shareReplay(1));

// Правильно
readonly time2$ = interval(1000).pipe(shareReplay({ bufferSize: 1, refCount: true }));
```

> [!WARNING]
> `shareReplay(1)` без `refCount: true` на бесконечном потоке держит подписку на источник навсегда. Если такой поток живёт в компоненте или содержит `switchMap` к данным пользователя — получится утечка памяти и запросы после ухода со страницы.

## Кеширование данных в сервисе

```ts
@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly http = inject(HttpClient);

  // Один запрос на всё приложение, результат кешируется навсегда — справочник не меняется
  readonly countries$ = this.http.get<Country[]>('/api/countries').pipe(shareReplay(1));
}
```

Здесь отсутствие `refCount` — осознанное решение: нужен вечный кеш, источник завершается сам.

### Кеш с инвалидацией

```ts
private readonly reload$ = new BehaviorSubject<void>(undefined);

readonly products$ = this.reload$.pipe(
  switchMap(() => this.http.get<Product[]>('/api/products')),
  shareReplay({ bufferSize: 1, refCount: true }),
);

invalidate() {
  this.reload$.next();
}
```

## Ошибки и shareReplay

Если источник упал, `shareReplay` не закеширует ошибку навсегда: следующий подписчик переподпишется на источник. А `share({ resetOnError: false })` позволяет оставить состояние после ошибки.

## Устаревшие операторы

`publish`, `publishReplay`, `multicast`, `refCount()` и `ConnectableObservable` объявлены устаревшими. Их заменяют `share`/`shareReplay` с параметрами и функция `connectable()`:

```ts
const source = connectable(interval(1000), { connector: () => new Subject() });
source.subscribe(a);
source.subscribe(b);
source.connect(); // ручной запуск после подключения всех подписчиков
```

## Альтернатива в Angular

`toSignal(user$)` в сервисе — одна подписка, а сигнал читают сколько угодно компонентов. Для данных по параметрам — `httpResource`. Это часто проще, чем подбирать настройки `shareReplay`.

> [!INTERVIEW]
> «Чем share отличается от shareReplay и зачем refCount?» — Оба делают поток multicast: одно выполнение источника на всех подписчиков. `share` не хранит значения — поздний подписчик видит только новые. `shareReplay` воспроизводит последние N значений новым подписчикам (кеш). `refCount: true` отписывается от источника, когда подписчиков не осталось; без него `shareReplay` держит подписку вечно, что для бесконечных потоков — утечка.

## Коротко

- `share` — общее выполнение, без кеша; сбрасывается, когда подписчики ушли.
- `shareReplay` — общее выполнение + воспроизведение последних значений.
- `shareReplay({ bufferSize: 1, refCount: true })` — безопасный вариант по умолчанию.
- `shareReplay(1)` без refCount — только для конечных источников, когда нужен вечный кеш.
- В Angular часто проще `toSignal` в сервисе или `httpResource`.
