Subject — одновременно Observable и Observer: на него можно подписаться и в него можно отправлять значения через `next()`. Это мост между императивным кодом («случилось событие») и реактивным миром потоков, а также способ раздать одно значение многим подписчикам.

## Subject

```ts
const messages = new Subject<string>();

messages.subscribe((m) => console.log('A:', m));
messages.next('привет'); // A: привет
messages.subscribe((m) => console.log('B:', m));
messages.next('мир'); // A: мир, B: мир
messages.complete();
```

- Не хранит значений: поздний подписчик видит только будущее.
- Multicast: все подписчики получают одно и то же значение.
- После `complete()` или `error()` новые `next` игнорируются, а новые подписчики сразу получают терминальное событие.

Типичное применение — шина событий внутри сервиса, сигнал уничтожения (`destroy$`) в старом коде, триггер перезагрузки:

```ts
private readonly refresh$ = new Subject<void>();
readonly data$ = this.refresh$.pipe(startWith(undefined), switchMap(() => this.api.load()));

refresh() {
  this.refresh$.next();
}
```

## BehaviorSubject

Хранит **текущее значение**, требует начальное и сразу отдаёт его новым подписчикам.

```ts
const user$ = new BehaviorSubject<User | null>(null);

user$.subscribe((u) => console.log('A:', u?.name)); // A: undefined (null)
user$.next({ name: 'Анна' }); // A: Анна
user$.subscribe((u) => console.log('B:', u?.name)); // B: Анна — сразу текущее значение
user$.getValue(); // синхронное чтение текущего значения
```

Это самый частый Subject в Angular-сервисах до появления сигналов — «состояние с подпиской».

```ts
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable(); // наружу — только чтение

  login(user: User) {
    this.userSubject.next(user);
  }
}
```

> [!TIP]
> Для нового кода состояния сервиса удобнее `signal`: у него тоже есть текущее значение, но нет ручной подписки и отписки. `BehaviorSubject` уместен, когда состояние нужно сразу комбинировать с другими потоками операторами RxJS.

## ReplaySubject

Хранит **последние N значений** (и/или значения за окно времени) и воспроизводит их новым подписчикам.

```ts
const log = new ReplaySubject<string>(2); // буфер на 2 значения
log.next('a');
log.next('b');
log.next('c');
log.subscribe(console.log); // b, c
```

Отличие от `BehaviorSubject(…)`: нет начального значения (подписчик ничего не получит, пока не было `next`), можно хранить больше одного значения, нет `getValue()`. `ReplaySubject(1)` часто используют для «последнего значения без заглушки».

## AsyncSubject

Отдаёт подписчикам **только последнее значение и только после complete**.

```ts
const result = new AsyncSubject<number>();
result.subscribe(console.log);
result.next(1);
result.next(2);
result.complete(); // 2
```

Похоже на Promise. Используется редко.

## Сравнение

| Тип | Начальное значение | Что получит поздний подписчик |
| --- | --- | --- |
| `Subject` | нет | только будущие значения |
| `BehaviorSubject` | обязательно | текущее значение + будущие |
| `ReplaySubject(n)` | нет | последние n значений + будущие |
| `AsyncSubject` | нет | последнее значение после complete |

## Антипаттерны

### Выставлять Subject наружу

```ts
// Плохо: любой может вызвать store.items$.next([]) и сломать состояние
readonly items$ = new BehaviorSubject<Item[]>([]);

// Хорошо
private readonly itemsSubject = new BehaviorSubject<Item[]>([]);
readonly items$ = this.itemsSubject.asObservable();
```

### Subject там, где хватает оператора

```ts
// Плохо: ручная трансляция одного потока в другой
const result$ = new Subject<Data>();
source$.subscribe((v) => result$.next(transform(v)));

// Хорошо
const result$ = source$.pipe(map(transform));
```

Subject нужен на границе императивного кода (событие из колбэка библиотеки, метод сервиса). Если источник уже Observable — используйте операторы.

### Забыть complete

Subject, который никто не завершает, держит подписчиков. В сервисах с временем жизни компонента завершайте Subject в `ngOnDestroy` или используйте `takeUntilDestroyed` на стороне подписчиков.

> [!INTERVIEW]
> «Чем BehaviorSubject отличается от ReplaySubject(1)?» — `BehaviorSubject` обязан иметь начальное значение, сразу отдаёт его подписчику и позволяет синхронно прочитать текущее через `getValue()`. `ReplaySubject(1)` не имеет начального значения: подписчик до первого `next` ничего не получит; зато после `complete` он продолжит воспроизводить последнее значение новым подписчикам, а `BehaviorSubject` после `complete` отдаст только complete.

## Коротко

- Subject — Observable + Observer, multicast.
- `BehaviorSubject` — текущее значение; `ReplaySubject(n)` — последние n; `AsyncSubject` — последнее после complete.
- Наружу отдавайте `asObservable()`.
- Не используйте Subject для того, что решается оператором.
- Для состояния в новом коде часто удобнее сигнал.
