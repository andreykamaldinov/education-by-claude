Операторы со временем (`debounceTime`, `retry` с задержкой, polling) неудобно тестировать реальными таймерами: тесты медленные и нестабильные. Marble-тесты описывают потоки строками-диаграммами и выполняются в **виртуальном времени** — мгновенно и детерминированно.

## Синтаксис marble-диаграмм

| Символ | Значение |
| --- | --- |
| `-` | один кадр виртуального времени (1 мс в `run`) |
| `a`, `b`, `1` | значение (буквы сопоставляются со словарём значений) |
| `\|` | complete |
| `#` | error |
| `^` | точка подписки (для горячих потоков) |
| `!` | точка отписки |
| `(ab)` | синхронная группа: несколько событий в один кадр |
| ` 100ms ` | промежуток времени (пробелы вокруг обязательны) |

```text
--a--b--|        значения a и b, затем complete
--a--#           a, затем ошибка
--(ab)--|        a и b в одном кадре
--a 200ms b|     b через 200 мс после a
```

## TestScheduler

```ts
import { TestScheduler } from 'rxjs/testing';

let scheduler: TestScheduler;

beforeEach(() => {
  scheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected); // сравнение через ваш тест-раннер
  });
});

it('map умножает значения', () => {
  scheduler.run(({ cold, expectObservable }) => {
    const source = cold(' -a-b-c|', { a: 1, b: 2, c: 3 });
    const expected = '   -x-y-z|';

    expectObservable(source.pipe(map((v) => v * 10))).toBe(expected, { x: 10, y: 20, z: 30 });
  });
});
```

Внутри `run` все операторы времени (`debounceTime`, `delay`, `interval`) используют виртуальное время автоматически.

## Тест debounceTime

```ts
it('debounceTime пропускает только последнее значение серии', () => {
  scheduler.run(({ cold, expectObservable }) => {
    // a в кадре 0, b — в 101, c — в 202, complete — в 703
    const input = cold('a 100ms b 100ms c 500ms |');
    // c выйдет через 300 мс тишины после себя: 202 + 300 = 502
    expectObservable(input.pipe(debounceTime(300))).toBe('502ms c 200ms |');
  });
});
```

Каждый символ значения тоже занимает один кадр, поэтому `a 100ms b` ставит `b` в кадр 101, а не 100. Когда считать кадры становится неудобно, описывайте ожидание через промежутки времени, как в примере.

## cold и hot

```ts
scheduler.run(({ cold, hot, expectObservable, expectSubscriptions }) => {
  const source = hot('  --a--^--b--c--|'); // ^ — момент подписки теста
  const sub = '              ^--------!';
  const expected = '         ---b--c--|';

  expectObservable(source).toBe(expected);
  expectSubscriptions(source.subscriptions).toBe(sub);
});
```

- `cold` — начинается при подписке (как HTTP-запрос).
- `hot` — идёт независимо; значения до `^` подписчик не увидит.
- `expectSubscriptions` проверяет, когда оператор подписался и отписался от источника — полезно для `switchMap`, `takeUntil`.

## Тест switchMap и отмены

```ts
it('switchMap отменяет предыдущий запрос', () => {
  scheduler.run(({ cold, hot, expectObservable, expectSubscriptions }) => {
    const query = hot('  -a--b---------|'); // запросы в кадрах 1 и 4
    const request = cold('----r|'); // ответ через 4 кадра после подписки

    expectObservable(query.pipe(switchMap(() => request))).toBe('--------r-----|');
    expectSubscriptions(request.subscriptions).toBe([
      '-^--!', //    первая подписка: кадр 1, отменена в кадре 4 — ответ так и не пришёл
      '----^----!', // вторая: кадр 4, завершилась в кадре 9
    ]);
  });
});
```

Первая подписка на запрос отменена (`!`), когда пришло `b`. Это и есть доказательство отсутствия гонки.

> [!TIP]
> Не стремитесь писать marble для всего. Для простых случаев достаточно `firstValueFrom` / `lastValueFrom` и проверки массива значений, а для времени — фейковых таймеров тест-раннера (`vi.useFakeTimers()`). Marble-тесты ценны для собственных операторов и сложной временной логики.

## Тест без marble-синтаксиса

```ts
it('собирает значения', async () => {
  const values = await firstValueFrom(of(1, 2, 3).pipe(map((x) => x * 2), toArray()));
  expect(values).toEqual([2, 4, 6]);
});

it('debounce с фейковыми таймерами', () => {
  vi.useFakeTimers();
  const results: string[] = [];
  const input = new Subject<string>();
  input.pipe(debounceTime(300)).subscribe((v) => results.push(v));

  input.next('a');
  vi.advanceTimersByTime(100);
  input.next('ab');
  vi.advanceTimersByTime(300);

  expect(results).toEqual(['ab']);
  vi.useRealTimers();
});
```

> [!INTERVIEW]
> «Как протестировать поток с debounceTime?» — Либо marble-тестом в `TestScheduler.run`, где время виртуальное и задаётся диаграммами, либо фейковыми таймерами тест-раннера: отправить значения в Subject, промотать время на нужное число миллисекунд и проверить собранные значения. Реальные таймеры в юнит-тестах не используются — это медленно и нестабильно.

## Коротко

- Marble-диаграммы: `-` время, буквы — значения, `|` complete, `#` error, `^` подписка, `!` отписка.
- `TestScheduler.run` — виртуальное время для всех операторов времени.
- `cold` — с момента подписки, `hot` — независимо от неё.
- `expectSubscriptions` проверяет отписки (отмены).
- Для простого — `firstValueFrom` и фейковые таймеры.
