Zone.js — библиотека, которая почти десять лет была «магией» Angular: благодаря ей интерфейс обновлялся после любого `setTimeout`, клика или HTTP-ответа без единой строчки кода. С Angular 21 новые приложения создаются без zone.js, но огромное количество существующих проектов работает на нём, и понимать его устройство по-прежнему нужно.

## Идея: контекст выполнения для асинхронного кода

Зона — это контекст, который «следует» за асинхронными операциями. Если `setTimeout` вызван внутри зоны, его колбэк тоже выполнится в этой зоне, а зона получит уведомления до и после выполнения.

```ts
const zone = Zone.current.fork({
  name: 'logging',
  onInvokeTask(delegate, current, target, task, applyThis, applyArgs) {
    console.log('до задачи', task.source);
    const result = delegate.invokeTask(target, task, applyThis, applyArgs);
    console.log('после задачи', task.source);
    return result;
  },
});

zone.run(() => {
  setTimeout(() => console.log('внутри таймера'), 100);
});
// до задачи setTimeout → внутри таймера → после задачи setTimeout
```

## Monkey-patching

Чтобы это работало, zone.js при загрузке **подменяет** глобальные асинхронные API своими обёртками:

- `setTimeout`, `setInterval`, `requestAnimationFrame`;
- `Promise` (точнее, перехватывает `then` и async/await через нативные промисы — для `async/await` Angular CLI в режиме zone.js понижает `async/await` до генераторов, иначе нативный `await` невидим для zone.js);
- `addEventListener` у `EventTarget`;
- `XMLHttpRequest`, `fetch`, `MutationObserver`, `WebSocket` и десятки других.

Обёртка запоминает текущую зону и выполняет колбэк в ней. Отсюда и название — «обезьяний патч»: изменение чужого кода в рантайме.

## NgZone

Angular создаёт свою зону — `NgZone` — и запускает приложение внутри неё. NgZone отслеживает, есть ли незавершённые микрозадачи, и генерирует события:

| Событие | Когда |
| --- | --- |
| `onUnstable` | код начал выполняться в зоне |
| `onMicrotaskEmpty` | очередь микрозадач опустела |
| `onStable` | зона стабильна: нет микрозадач, проверка выполнена |
| `onError` | необработанная ошибка в зоне |

Angular подписан на `onMicrotaskEmpty` и вызывает `ApplicationRef.tick()`. То есть после **любой** асинхронной операции внутри зоны запускается проверка всего дерева компонентов.

```text
клик → обработчик (в NgZone) → микрозадачи выполнены → onMicrotaskEmpty → tick() → обновление DOM
```

## Цена такого подхода

1. **Лишние проверки.** `mousemove` на документе, сторонний виджет с `setInterval`, polling аналитики — всё это вызывает проверку приложения, даже если данные Angular не менялись.
2. **Размер и старт.** zone.js — около 30 КБ дополнительного кода, загружаемого до приложения.
3. **Сложная отладка.** Стек вызовов полон обёрток зоны.
4. **Нативный async/await** нельзя перехватить: приходится понижать его при сборке.
5. **Несовместимость** с некоторыми API и библиотеками, которые zone.js не патчит или патчит неправильно.
6. **«Магия» скрывает модель данных**: код с мутациями полей работает «сам», пока не перестаёт.

## runOutsideAngular

Классическая оптимизация в zone-приложениях — вынести частые события из зоны:

```ts
export class Canvas {
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLCanvasElement>);
  protected readonly coords = signal({ x: 0, y: 0 });

  constructor() {
    afterNextRender(() => {
      this.zone.runOutsideAngular(() => {
        // mousemove не будет запускать change detection
        this.host.nativeElement.addEventListener('mousemove', (e: MouseEvent) => {
          this.draw(e.offsetX, e.offsetY);
          if (this.shouldShowCoords(e)) {
            this.zone.run(() => this.coords.set({ x: e.offsetX, y: e.offsetY })); // вернуться в зону, когда нужно обновить UI
          }
        });
      });
    });
  }
}
```

С сигналами `zone.run` для обновления уже не нужен: изменение сигнала само планирует проверку.

## Настройки zone-режима

```ts
bootstrapApplication(App, {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true, // объединить несколько событий одного кадра в одну проверку
      runCoalescing: true, // то же для zone.run
    }),
  ],
});
```

С Angular 21, где новые проекты zoneless по умолчанию, `provideZoneChangeDetection()` нужно указывать явно, если приложение полагается на zone.js. Сам `zone.js` подключается в `polyfills` в `angular.json`.

## Признаки зависимости кода от zone.js

- Поля компонента меняются в `setTimeout`, колбэках сторонних библиотек или `subscribe` и сразу отображаются без сигналов, `async` pipe и `markForCheck`.
- Используются `NgZone.onStable` / `onMicrotaskEmpty` для «ожидания рендера».
- Тесты используют `fakeAsync` / `tick` / `waitForAsync` (они основаны на zone.js; в zoneless-тестах используют фейковые таймеры Vitest и `await fixture.whenStable()`).

> [!INTERVIEW]
> «Что такое zone.js и зачем он Angular?» — Библиотека, которая патчит асинхронные API браузера (таймеры, события, промисы, XHR) и создаёт контекст выполнения, следующий за асинхронным кодом. Angular запускает приложение в `NgZone` и после завершения каждой задачи (когда очередь микрозадач пуста) вызывает `ApplicationRef.tick()`, то есть change detection. Минусы: лишние проверки, размер, сложная отладка, проблемы с нативным async/await. Поэтому Angular перешёл на zoneless: проверку планируют сигналы, события шаблона и `markForCheck`.

## Коротко

- Зона — контекст, сопровождающий асинхронные операции; zone.js патчит асинхронные API.
- `NgZone` вызывает `tick()` после каждой асинхронной задачи → проверка всего приложения.
- `runOutsideAngular` — способ избежать лишних проверок на частых событиях.
- Минусы: производительность, размер, отладка, async/await.
- Angular 21+: zoneless по умолчанию, zone.js — только по явному выбору.
