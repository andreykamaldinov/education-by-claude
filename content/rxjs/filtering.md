Операторы фильтрации решают, какие значения пропустить дальше и когда завершить поток. Временные операторы (`debounceTime`, `throttleTime`, `auditTime`) — частный случай фильтрации, где решение зависит от времени.

## filter

```ts
keydown$.pipe(filter((e) => e.key === 'Enter'));

// Type guard сужает тип потока
const user$: Observable<User | null> = ...;
user$.pipe(filter((u): u is User => u !== null)); // Observable<User>
```

## take, first, takeWhile, takeUntil

```ts
interval(1000).pipe(take(3)); // 0, 1, 2 и complete

clicks$.pipe(first()); // первое значение и complete
users$.pipe(first((u) => u.isAdmin)); // первое подходящее
// first() бросает EmptyError, если поток завершился без значений; take(1) — нет

scroll$.pipe(takeWhile((y) => y < 1000)); // пока условие истинно
scroll$.pipe(takeWhile((y) => y < 1000, true)); // включая первое неподходящее значение

ticks$.pipe(takeUntil(stop$)); // до первого значения stop$
```

`takeUntil` — классический способ отписки в старом Angular-коде:

```ts
private readonly destroy$ = new Subject<void>();

ngOnInit() {
  this.data$.pipe(takeUntil(this.destroy$)).subscribe(...);
}
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

Сегодня его заменяет `takeUntilDestroyed()`.

## skip

```ts
value$.pipe(skip(1)); // пропустить первое значение (например, начальное у BehaviorSubject)
skipUntil(ready$); // игнорировать до сигнала
skipWhile((v) => v < 0);
```

## distinctUntilChanged

Пропускает значение, только если оно **отличается от предыдущего**:

```ts
of(1, 1, 2, 2, 2, 1).pipe(distinctUntilChanged()); // 1, 2, 1

// Объекты сравниваются по ссылке — задайте компаратор или ключ
filters$.pipe(distinctUntilChanged((a, b) => a.page === b.page && a.query === b.query));
user$.pipe(distinctUntilKeyChanged('id'));
```

`distinct()` (без «UntilChanged») отбрасывает **все** повторы за всё время — держит множество увиденных значений, осторожно с памятью.

## debounceTime: тишина после серии

Выдаёт значение, только если после него прошло N мс **без новых значений**:

```text
input:        -a-b-c-------d-e------|
debounceTime(300)
output:       ----------c-------e---|
```

```ts
this.query.valueChanges.pipe(
  debounceTime(300), // ждём, пока пользователь перестанет печатать
  map((q) => q.trim()),
  distinctUntilChanged(), // не искать то же самое повторно
  switchMap((q) => this.api.search(q)),
);
```

**Когда**: поиск по вводу, автосохранение, обработка `resize` после окончания.

## throttleTime: не чаще чем

Пропускает первое значение, затем игнорирует все в течение N мс:

```text
input:        -a-b-c-d-e-f-g-|
throttleTime(300)  (окно ≈ 3 «тика»)
output:       -a-----d-----g-|
```

```ts
scroll$.pipe(throttleTime(100)); // реагировать на прокрутку не чаще 10 раз в секунду
clicks$.pipe(throttleTime(1000)); // защита от многократного клика
```

Опции `{ leading: true, trailing: true }` управляют тем, выдавать ли первое и последнее значения окна.

## auditTime и sampleTime

```ts
mousemove$.pipe(auditTime(16)); // после начала окна ждать N мс и выдать ПОСЛЕДНЕЕ значение
position$.pipe(sampleTime(1000)); // раз в секунду выдать последнее значение (если было новое)
```

| Оператор | Что выдаёт |
| --- | --- |
| `debounceTime` | последнее значение после паузы |
| `throttleTime` | первое значение окна (по умолчанию) |
| `auditTime` | последнее значение окна |
| `sampleTime` | последнее значение на каждый тик таймера |

> [!TIP]
> Мнемоника: **debounce** — «подожди, пока успокоится», **throttle** — «не чаще, чем», **audit** — «в конце окна возьми свежее».

## Длительность, зависящая от значения

```ts
debounce((q) => (q.length < 3 ? timer(600) : timer(200)));
throttle(() => this.apiReady$);
```

## Элементы по позиции

```ts
elementAt(2); // третье значение
last(); // последнее (после complete)
single((x) => x.id === id); // ровно одно подходящее, иначе ошибка
ignoreElements(); // только complete/error
```

> [!INTERVIEW]
> «Чем debounceTime отличается от throttleTime?» — `debounceTime` ждёт паузу заданной длины после последнего значения и только тогда выдаёт его: подходит для поиска по вводу. `throttleTime` выдаёт первое значение и затем игнорирует все остальные в течение окна: подходит для ограничения частоты обработки прокрутки или кликов. При непрерывном потоке событий `debounceTime` не выдаст ничего, а `throttleTime` будет выдавать регулярно.

## Коротко

- `filter` с type guard сужает тип потока.
- `take`, `first`, `takeWhile`, `takeUntil` завершают поток.
- `distinctUntilChanged` — только изменившиеся значения (объекты — с компаратором).
- `debounceTime` — после паузы, `throttleTime` — не чаще, `auditTime` — последнее в окне.
- Связка поиска: `debounceTime → distinctUntilChanged → switchMap`.
