Планировщик (scheduler) определяет, **когда** и **в каком контексте** выполняется работа в RxJS: синхронно, в микрозадаче, в макрозадаче или перед кадром анимации. В повседневном коде вы редко указываете их явно, но они объясняют поведение операторов времени и нужны в тестах.

## Виды планировщиков

| Планировщик | Механизм | Когда выполняется |
| --- | --- | --- |
| `null` (по умолчанию для синхронных) | — | синхронно, рекурсивно |
| `queueScheduler` | очередь | синхронно, но вложенные задачи — по очереди, без рекурсии |
| `asapScheduler` | микрозадача (`Promise.resolve`) | сразу после текущего синхронного кода |
| `asyncScheduler` | `setTimeout`/`setInterval` | в макрозадаче; используется операторами времени |
| `animationFrameScheduler` | `requestAnimationFrame` | перед следующей отрисовкой кадра |

## Как они влияют на порядок

```ts
console.log('start');

of('sync').subscribe(console.log);
scheduled(['async'], asyncScheduler).subscribe(console.log);
scheduled(['asap'], asapScheduler).subscribe(console.log);

console.log('end');
// start, sync, end, asap, async
```

Сигнатуры вида `of(x, scheduler)` устарели — используйте `scheduled(input, scheduler)` или операторы `observeOn`/`subscribeOn`.

## Операторы времени используют asyncScheduler

`debounceTime`, `throttleTime`, `delay`, `interval`, `timer`, `bufferTime`, `timeout` по умолчанию работают на `asyncScheduler`, но принимают планировщик последним аргументом:

```ts
interval(1000, animationFrameScheduler);
debounceTime(300, testScheduler); // в тестах — виртуальное время
```

## observeOn и subscribeOn

```ts
// observeOn — доставлять уведомления подписчику через указанный планировщик
source$.pipe(observeOn(animationFrameScheduler)).subscribe((pos) => (el.style.transform = `translateX(${pos}px)`));

// subscribeOn — выполнить саму подписку (запуск продюсера) через планировщик
heavySync$.pipe(subscribeOn(asyncScheduler)).subscribe(...); // не блокировать текущий синхронный код
```

## Анимации

```ts
const duration = 1000;

const tween$ = defer(() => {
  const start = animationFrameScheduler.now();
  return interval(0, animationFrameScheduler).pipe(
    map(() => (animationFrameScheduler.now() - start) / duration),
    takeWhile((t) => t < 1, true),
    map((t) => Math.min(t, 1)),
  );
});

tween$.subscribe((t) => (box.style.opacity = String(t)));
```

Каждое значение совпадает с кадром отрисовки — анимация плавная и не тратит работу между кадрами.

## queueScheduler против рекурсии

```ts
// Рекурсивное планирование на queueScheduler выполняется итеративно, без переполнения стека
queueScheduler.schedule(function (state = 0) {
  if (state < 100_000) this.schedule(state + 1);
});
```

## Планировщики в тестах

`TestScheduler` подменяет время виртуальным: `debounceTime(300)` «проходит» мгновенно. Внутри `testScheduler.run(...)` все операторы времени автоматически используют виртуальное время. Подробнее — [Marble-тестирование](/tracks/rxjs/testing-marbles).

## Планировщики и Angular

- Change detection не зависит от планировщика RxJS. В zoneless-режиме обновление UI запускает запись в сигнал или `markForCheck` (через `async` pipe), а не тот факт, что значение пришло в микро- или макрозадаче.
- `animationFrameScheduler` полезен для визуальных обновлений вне шаблона (canvas, transform), чтобы не делать больше одной записи в DOM за кадр.

> [!INTERVIEW]
> «Что такое планировщики в RxJS и когда их задавать?» — Планировщик определяет, когда выполнить работу: синхронно, в микрозадаче (`asapScheduler`), в макрозадаче (`asyncScheduler`, используется операторами времени по умолчанию) или перед кадром (`animationFrameScheduler`). Явно их задают редко: для анимаций (`animationFrameScheduler`), чтобы не блокировать синхронный код (`subscribeOn(asyncScheduler)`), и в тестах через `TestScheduler` с виртуальным временем.

## Коротко

- Планировщик управляет моментом выполнения: sync, queue, asap (микрозадача), async (макрозадача), animationFrame.
- Операторы времени по умолчанию используют `asyncScheduler`.
- `observeOn` — где доставлять значения, `subscribeOn` — где выполнять подписку.
- `animationFrameScheduler` — для плавных анимаций.
- В тестах время подменяет `TestScheduler`.
